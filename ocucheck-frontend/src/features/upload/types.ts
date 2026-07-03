export type UploadStatus =
  | "idle"
  | "dragover"
  | "validating"
  | "uploading"
  | "analyzing"
  | "success"
  | "error";

export interface UploadState {
  status: UploadStatus;
  file: File | null;
  preview: string | null;
  imageId: string | null;
  progress: number;
  error: string | null;
  message: string | null;
}