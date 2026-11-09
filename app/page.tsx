import Image from 'next/image';
import { ArrowDown, ArrowUpRight, Check, ShieldCheck, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WhitelistForm from '@/components/WhitelistForm';
import Faq from '@/components/Faq';
import { getCollectionSettings } from '@/lib/collection-settings';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const settings = await getCollectionSettings();
  const collection = settings.collection_name;
  const details = [
    ['TOTAL SUPPLY', settings.supply ? Number(settings.supply).toLocaleString() : '5,555'],
    ['NETWORK', settings.network || 'Ethereum'],
    ['MINT PRICE', settings.mint_price || 'TBA'],
    ['MINT DATE', settings.mint_date || 'TBA']
  ];

  return (
    <main id="home" className="overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="section-wrap relative grid min-h-[690px] items-center gap-10 pb-16 pt-12 lg:grid-cols-[1.02fr_.98fr]">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 border-2 border-[#171820] bg-[#f6d52b] px-3 py-2 font-mono text-[10px] font-bold tracking-widest shadow-[3px_3px_0_#171820]">
            <span className="blink h-2 w-2 bg-[#e42c24]" />{' '}
            {settings.whitelist_open === 'false' ? 'WHITELIST REGISTRATION IS CLOSED' : 'WHITELIST REGISTRATION IS OPEN'}
          </div>

          <h1 className="pixel-title max-w-[680px] text-[clamp(4rem,9vw,8.2rem)] font-black">
            NOT JUST<br />
            PIXELS.<br />
            <span className="text-[#e42c24]">PERSONALITY.</span>
          </h1>

          <p className="mt-7 max-w-[460px] text-lg font-medium leading-relaxed text-[#394127]">
            {settings.tagline || 'Small pixels. Big personalities.'} Meet the characters, join the community, and get in early.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a className="pixel-btn" href="#whitelist">
              JOIN THE WHITELIST <ArrowUpRight size={17} />
            </a>
            <a className="pixel-btn light" href="#about">
              MEET THE PROJECT <ArrowDown size={16} />
            </a>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              {['/characters/pirate-captain.jpg', '/characters/red-beanie.jpg', '/characters/fire-hero.jpg'].map(src => (
                <div key={src} className="h-10 w-10 overflow-hidden rounded-full border-2 border-[#171820] bg-[#f7f7ed]">
                  <Image src={src} alt="Pixel character" width={80} height={80} className="h-full w-full object-cover object-top" />
                </div>
              ))}
            </div>
            <div className="text-xs font-semibold">
              A LITTLE PIXEL MAGIC.<br />
              <span className="font-normal text-[#535744]">A community with character.</span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="grid-bg absolute inset-0 -rotate-3 border-2 border-[#171820] bg-[#b2df43]" />
          <div className="relative grid grid-cols-2 items-end gap-1 px-3 pt-5 sm:px-6">
            <div className="float relative z-10 -mr-7">
              <Image
                src="/characters/pirate-captain.jpg"
                alt="Pixel pirate character"
                width={520}
                height={520}
                priority
                className="h-auto w-full drop-shadow-[5px_7px_0_rgba(23,24,32,.2)]"
              />
            </div>
            <div className="relative z-20 mt-20">
              <Image
                src="/characters/red-beanie.jpg"
                alt="Pixel character in red beanie"
                width={520}
                height={520}
                priority
                className="float h-auto w-full [animation-delay:1s] drop-shadow-[5px_7px_0_rgba(23,24,32,.2)]"
              />
            </div>
            <div className="absolute -bottom-2 left-[28%] z-30 w-[43%]">
              <Image
                src="/characters/fire-hero.jpg"
                alt="Pixel fire hero character"
                width={520}
                height={520}
                className="h-auto w-full drop-shadow-[5px_7px_0_rgba(23,24,32,.2)]"
              />
            </div>
            <div className="absolute -right-3 top-5 z-30 rotate-6 border-2 border-[#171820] bg-[#f6d52b] px-3 py-2 font-mono text-[10px] font-bold shadow-[3px_3px_0_#171820]">
              5,555 UNIQUE VIBES ✦
            </div>
          </div>
          <div className="relative mt-5 flex items-center justify-between border-2 border-[#171820] bg-[#171820] px-4 py-3 text-white">
            <span className="eyebrow">YOUR NEXT FAVOURITE CHARACTER</span>
            <span className="font-mono text-xs text-[#c2ed55]">[ 001 — 5555 ]</span>
          </div>
        </div>
      </section>

      {/* Marquee Banner */}
      <div className="marquee">
        <div className="marquee-track">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i}>✳ PIXEL POWER ✳ COMMUNITY FIRST ✳ GOOD VIBES ONLY ✳ GET WHITELISTED ✳</span>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="section-wrap grid gap-10 py-24 md:grid-cols-[.85fr_1.15fr]">
        <div>
          <div className="eyebrow mb-4">THE COLLECTION / 001</div>
          <h2 className="pixel-title text-6xl font-black sm:text-7xl">
            BUILT<br />
            DIFFERENT.<br />
            <span className="text-[#e42c24]">PIXEL BY PIXEL.</span>
          </h2>
        </div>
        <div className="flex flex-col justify-center">
          <p className="max-w-2xl text-xl font-semibold leading-relaxed">
            {collection} is a world of bold characters, unexpected details, and a community that brings every pixel to life.
          </p>
          <p className="mt-5 max-w-2xl leading-relaxed text-[#465032]">
            This is more than a profile picture. It is a collectible identity and a front-row seat to the next chapter. Get on the list and follow the journey from the beginning.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="border-2 border-[#171820] bg-[#f6d52b] p-4">
              <Zap />
              <b className="mt-3 block">Character-first</b>
              <span className="text-xs">Distinct pixel personalities.</span>
            </div>
            <div className="border-2 border-[#171820] bg-[#f7f7ed] p-4">
              <ShieldCheck />
              <b className="mt-3 block">Community-led</b>
              <span className="text-xs">Built with the people.</span>
            </div>
            <div className="border-2 border-[#171820] bg-[#e42c24] p-4 text-white">
              <Check />
              <b className="mt-3 block">Made to stand out</b>
              <span className="text-xs">Never another copy-paste.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section id="details" className="border-y-2 border-[#171820] bg-[#f7f7ed] py-20">
        <div className="section-wrap">
          <div className="eyebrow mb-3">THE IMPORTANT BITS / 002</div>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h2 className="pixel-title text-6xl font-black sm:text-7xl">
              THE<br />
              SPECS.
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-[#535744]">
              The essentials, without the noise. Final mint information will be confirmed through official announcements.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {details.map(([label, value], i) => (
              <div
                key={label}
                className={`border-2 border-[#171820] p-5 ${
                  i === 1 ? 'bg-[#c2ed55]' : i === 2 ? 'bg-[#f6d52b]' : 'bg-white'
                }`}
              >
                <div className="eyebrow">{label}</div>
                <div className="mt-5 break-words text-3xl font-black tracking-[-.06em] sm:text-4xl">{value}</div>
                <div className="mt-4 h-1 w-10 bg-[#e42c24]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Whitelist Section */}
      <section id="whitelist" className="section-wrap grid gap-12 py-24 lg:grid-cols-[.9fr_1.1fr]">
        <div className="pt-4">
          <div className="eyebrow mb-4">THE ENTRY POINT / 003</div>
          <h2 className="pixel-title text-6xl font-black sm:text-7xl">
            YOUR<br />
            PIXEL<br />
            <span className="text-[#e42c24]">ERA STARTS.</span>
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-[#465032]">
            Complete the social tasks and submit your wallet address with your reply link. Submitting an application does not guarantee whitelist allocation.
          </p>
          <div className="mt-8 space-y-3 text-sm font-semibold">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center border-2 border-[#171820] bg-[#f6d52b] font-mono">1</span>
              Follow @Buzquitos on X
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center border-2 border-[#171820] bg-[#f6d52b] font-mono">2</span>
              Like, Retweet & Reply on the pinned post
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center border-2 border-[#171820] bg-[#f6d52b] font-mono">3</span>
              Submit your wallet & reply link
            </div>
          </div>
          <div className="mt-10 max-w-[230px] rotate-[-5deg] border-2 border-[#171820] bg-[#e42c24] p-3 text-center font-mono text-xs font-bold text-white shadow-[4px_4px_0_#171820]">
            NO WALLET CONNECTION NEEDED ✦
          </div>
        </div>
        <WhitelistForm isOpen={settings.whitelist_open !== 'false'} />
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="border-y-2 border-[#171820] bg-[#f6d52b] py-20">
        <div className="section-wrap">
          <div className="eyebrow mb-3">THE JOURNEY / 004</div>
          <h2 className="pixel-title text-6xl font-black sm:text-7xl">NEXT UP.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ['01', 'THE DROP', 'Collection reveal, whitelist activity, and launch preparation.'],
              ['02', 'THE COMMUNITY', 'Bring holders together with experiences, access, and community moments.'],
              ["03", "WHAT'S NEXT", 'New utility and future plans shaped by the community.']
            ].map(([n, title, desc]) => (
              <div key={n} className="border-2 border-[#171820] bg-[#f7f7ed] p-6 shadow-[5px_5px_0_#171820]">
                <div className="font-mono text-4xl font-bold text-[#e42c24]">{n}</div>
                <h3 className="mt-8 text-2xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#535744]">{desc}</p>
                <div className="mt-8 h-1 w-full bg-[#c2ed55]">
                  <div className="h-1 w-1/3 bg-[#171820]" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-[10px]">* ROADMAP ITEMS ARE PLANNING GOALS AND MAY CHANGE.</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section-wrap grid gap-10 py-24 md:grid-cols-[.75fr_1.25fr]">
        <div>
          <div className="eyebrow mb-4">GOOD QUESTIONS / 005</div>
          <h2 className="pixel-title text-6xl font-black sm:text-7xl">
            FAQ<span className="text-[#e42c24]">.</span>
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#465032]">
            A few quick answers. Still curious? Find us on our official X channel.
          </p>
        </div>
        <Faq />
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-[#171820] bg-[#171820] py-8 text-white">
        <div className="section-wrap flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="font-black tracking-tight">
              {collection.toUpperCase()} <span className="text-[#c2ed55]">✳</span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-white/50">SMALL PIXELS. BIG PERSONALITIES.</div>
          </div>
          <div className="flex flex-wrap gap-5 text-xs font-semibold">
            <a
              href={process.env.NEXT_PUBLIC_X_URL || 'https://x.com/Buzquitos'}
              target="_blank"
              rel="noreferrer"
            >
              X / TWITTER ↗
            </a>
            <a href="#home">BACK TO TOP ↑</a>
          </div>
          <div className="font-mono text-[10px] text-white/45">
            © 2026 {collection}. ALL PIXELS RESERVED.
          </div>
        </div>
      </footer>
    </main>
  );
}
