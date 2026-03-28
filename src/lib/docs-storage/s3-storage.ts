import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import type { DocsStorage, ObjectHead } from "./types";
import { folderKeepRelKey, normalizeDocRelKey } from "./keys";

export interface S3DocsStorageOptions {
  bucket: string;
  /** Optional key prefix, e.g. `content/docs/` — trailing slash optional */
  prefix?: string;
  region?: string;
}

export class S3DocsStorage implements DocsStorage {
  private readonly client: S3Client;
  private readonly normalizedPrefix: string;

  constructor(private readonly opts: S3DocsStorageOptions) {
    this.client = new S3Client({
      region: opts.region ?? process.env.AWS_REGION ?? "ap-southeast-1",
    });
    const p = (opts.prefix ?? "").replace(/^\/+/, "");
    this.normalizedPrefix = p.endsWith("/") || p === "" ? p : `${p}/`;
  }

  private fullKey(relKey: string): string {
    const key = normalizeDocRelKey(relKey);
    return `${this.normalizedPrefix}${key}`;
  }

  private toRelKey(fullObjectKey: string): string {
    if (!this.normalizedPrefix) return fullObjectKey;
    if (fullObjectKey.startsWith(this.normalizedPrefix)) {
      return fullObjectKey.slice(this.normalizedPrefix.length);
    }
    return fullObjectKey;
  }

  async getText(relKey: string): Promise<string | null> {
    try {
      const out = await this.client.send(
        new GetObjectCommand({
          Bucket: this.opts.bucket,
          Key: this.fullKey(relKey),
        }),
      );
      const body = out.Body;
      if (!body) return null;
      return await body.transformToString("utf-8");
    } catch (e: unknown) {
      if ((e as { name?: string }).name === "NoSuchKey") return null;
      throw e;
    }
  }

  async head(relKey: string): Promise<ObjectHead | null> {
    try {
      const out = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.opts.bucket,
          Key: this.fullKey(relKey),
        }),
      );
      return {
        lastModified: out.LastModified ?? new Date(),
        size: Number(out.ContentLength ?? 0),
      };
    } catch (e: unknown) {
      if ((e as { name?: string }).name === "NotFound") return null;
      if ((e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404)
        return null;
      throw e;
    }
  }

  async putText(relKey: string, body: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.opts.bucket,
        Key: this.fullKey(relKey),
        Body: Buffer.from(body, "utf-8"),
        ContentType: "text/mdx; charset=utf-8",
      }),
    );
  }

  async deleteKey(relKey: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.opts.bucket,
          Key: this.fullKey(relKey),
        }),
      );
    } catch {
      /* ignore */
    }
  }

  async deletePrefix(relPrefix: string): Promise<void> {
    const prefix = normalizeDocRelKey(relPrefix);
    const keys = await this.listAllKeys();
    const toDelete = keys.filter(
      (k) => k === prefix || k.startsWith(`${prefix}/`),
    );
    await Promise.all(toDelete.map((k) => this.deleteKey(k)));
  }

  async listAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    let ContinuationToken: string | undefined;
    const Prefix = this.normalizedPrefix;
    do {
      const out = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.opts.bucket,
          Prefix,
          ContinuationToken,
        }),
      );
      for (const obj of out.Contents ?? []) {
        if (obj.Key) keys.push(this.toRelKey(obj.Key));
      }
      ContinuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
    } while (ContinuationToken);
    return [...new Set(keys)].sort();
  }

  async copyKey(fromRel: string, toRel: string): Promise<void> {
    const src = this.fullKey(fromRel);
    const dest = this.fullKey(toRel);
    const copySource = `${this.opts.bucket}/${src.split("/").map(encodeURIComponent).join("/")}`;
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.opts.bucket,
        CopySource: copySource,
        Key: dest,
        MetadataDirective: "COPY",
      }),
    );
  }

  async exists(relKey: string): Promise<boolean> {
    return (await this.head(relKey)) !== null;
  }

  async isFolder(relPath: string): Promise<boolean> {
    const p = normalizeDocRelKey(relPath);
    const keep = folderKeepRelKey(p);
    if (await this.exists(keep)) return true;
    const prefix = `${p}/`;
    const keys = await this.listAllKeys();
    return keys.some((k) => k.startsWith(prefix));
  }

  async createFolder(folderRelPath: string): Promise<void> {
    const keep = folderKeepRelKey(folderRelPath);
    if (!(await this.exists(keep))) {
      await this.putText(keep, "");
    }
  }

  async ensureParentDirsForFile(_fileRelKey: string): Promise<void> {
    /* S3 has no directories */
  }

  async movePath(sourceRel: string, destRel: string): Promise<void> {
    const src = normalizeDocRelKey(sourceRel);
    const dst = normalizeDocRelKey(destRel);
    if (await this.isFolder(src)) {
      const keys = (await this.listAllKeys()).filter(
        (k) => k === src || k.startsWith(`${src}/`),
      );
      for (const k of keys) {
        const rest = k === src ? "" : k.slice(src.length + 1);
        const nk = rest ? `${dst}/${rest}` : dst;
        await this.copyKey(k, nk);
      }
      keys.sort((a, b) => b.length - a.length);
      for (const k of keys) {
        await this.deleteKey(k);
      }
      return;
    }
    await this.copyKey(src, dst);
    await this.deleteKey(src);
  }
}
