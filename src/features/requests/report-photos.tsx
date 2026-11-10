import Image from "next/image";

// Thumbnails of a report's photos. They come through the authenticated
// /api/photos route, so the optimizer is bypassed; each opens full size.
export function ReportPhotos({ photoIds }: { photoIds?: number[] }) {
  if (!photoIds?.length) return null;
  return (
    <div className="my-1.5 flex flex-wrap gap-1.5">
      {photoIds.map((id, index) => (
        <a
          key={id}
          href={`/api/photos/${id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            className="rounded-md border border-tone-ccd9d1 object-cover"
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
