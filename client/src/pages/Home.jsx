import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Home = () => {
  const heroRef = useRef(null);

  useGSAP(
    () => {
      gsap.from(".hero-text", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      });

      gsap.from(".hero-image", {
        scale: 0.92,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
      });
    },
    { scope: heroRef },
  );

  return (
    <main id="home" ref={heroRef} className="bg-[#faf7f2]">
      <section className="mx-auto grid min-h-[55vh] max-w-7xl items-center gap-8 px-6 py-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="hero-text text-sm uppercase tracking-[0.5em] text-stone-400">
            Fine Jewelry
          </p>

          <h1 className="hero-text mt-4 max-w-lg text-4xl font-extrabold leading-tight text-stone-950 md:text-5xl">
            Jewelry that whispers luxury.
          </h1>

          <p className="hero-text mt-4 max-w-md text-base leading-7 text-stone-600">
            Discover elegant rings, necklaces and bracelets designed for a soft,
            timeless glow.
          </p>

          <div className="hero-text mt-8 flex items-center gap-4">
            <a
              href="#products"
              className="inline-flex items-center gap-3 rounded-full bg-stone-950 px-6 py-3 text-white transition hover:bg-stone-700"
            >
              Shop Now
              <ArrowRight size={18} />
            </a>

            <a
              href="#collections"
              className="rounded-full border border-stone-300 px-6 py-3 text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
            >
              Explore
            </a>
          </div>
        </div>

        <div className="hero-image relative">
          <div className="relative overflow-hidden rounded-[2rem] shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338"
              alt="Luxury jewelry"
              className="h-[300px] w-full object-cover md:h-[340px]"
            />
          </div>

          <div className="absolute bottom-5 left-5 rounded-2xl bg-white/85 p-4 shadow-lg backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
              New Drop
            </p>
            <p className="mt-1 text-lg font-semibold text-stone-900">
              Golden Essentials
            </p>
          </div>
        </div>
      </section>

      <section id="collections" className="mx-auto max-w-7xl px-6 pt-14 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.35em] text-stone-400">
              Rings
            </p>
            <h3 className="mt-3 text-2xl font-bold text-stone-900">
              Minimal sparkle
            </h3>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.35em] text-stone-400">
              Necklaces
            </p>
            <h3 className="mt-3 text-2xl font-bold text-stone-900">
              Soft elegance
            </h3>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm uppercase tracking-[0.35em] text-stone-400">
              Bracelets
            </p>
            <h3 className="mt-3 text-2xl font-bold text-stone-900">
              Everyday glow
            </h3>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
