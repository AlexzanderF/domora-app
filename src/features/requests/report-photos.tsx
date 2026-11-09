import Image from "next/image";
import styles from "./report-photos.module.css";

// Thumbnails of a report's photos. They come through the authenticated
// /api/photos route, so the optimizer is bypassed; each opens full size.
export function ReportPhotos({ photoIds }: { photoIds?: number[] }) {
  if (!photoIds?.length) return null;
  return (
    <div className={styles.photos}>
      {photoIds.map((id, index) => (
        <a
          key={id}
          href={`/api/photos/${id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            className={styles.photo}
            src={`/api/photos/${id}`}
            width={80}
            height={80}
            unoptimized
            alt={`Снимка ${index + 1} към отчета`}
          />
        </a>
      ))}
    </div>
  );
}
