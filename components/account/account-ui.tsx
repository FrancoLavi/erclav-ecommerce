import type { LucideIcon } from "lucide-react";

export function AccountHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase text-neutral-500">{eyebrow}</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{description}</p></div>{action}</div>;
}

export function AccountPanel({ title, description, children, className = "" }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-6 ${className}`}><div className="mb-5"><h2 className="text-xl font-black">{title}</h2>{description ? <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p> : null}</div>{children}</section>;
}

export function EmptyAccountState({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children?: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-black/15 bg-[#fbfaf8] px-5 py-10 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white shadow-sm"><Icon className="h-6 w-6 text-neutral-500" aria-hidden /></span><h2 className="mt-4 font-black">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">{description}</p>{children ? <div className="mt-5">{children}</div> : null}</div>;
}
