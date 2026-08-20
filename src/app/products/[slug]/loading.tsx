import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Skeleton className="h-11 w-48" />

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <Skeleton className="aspect-[4/5] w-full" />

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-9 w-9" />
            </div>
            <Skeleton className="h-14 w-3/4" />
            <Skeleton className="h-6 w-32" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="mt-4 flex max-w-sm flex-col gap-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
