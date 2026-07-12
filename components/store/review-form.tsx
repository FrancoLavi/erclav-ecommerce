import { createReviewAction } from "@/actions/store";

export function ReviewForm({ productId }: { productId: string }) {
  return (
    <form action={createReviewAction} className="rounded-lg border border-black/10 bg-white p-5">
      <input type="hidden" name="productId" value={productId} />
      <h3 className="text-base font-semibold">Escribi una review</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr]">
        <select name="rating" className="h-11 rounded-md border border-neutral-300 px-3 text-sm">
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} estrellas
            </option>
          ))}
        </select>
        <input name="title" placeholder="Titulo" className="h-11 rounded-md border border-neutral-300 px-3 text-sm" />
      </div>
      <textarea name="comment" placeholder="Contanos tu experiencia" className="mt-3 min-h-24 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      <button className="mt-3 h-10 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white">Publicar</button>
    </form>
  );
}
