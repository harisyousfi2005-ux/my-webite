import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <>
      <Skeleton className="h-[100dvh] min-h-[560px] w-full" />
      <section className="border-b border-line py-24">
        <Container>
          <Skeleton className="mb-14 h-12 w-64" />
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="aspect-[4/5] w-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
