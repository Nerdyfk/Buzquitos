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
    ['CATEGORY', 'Pixel PFP'],
    ['NETWORK', settings.network || 'Ethereum'],
    ['MINT PRICE', settings.mint_price || 'TBA']
  ];

  return (
    <main id="home" className="overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="section-wrap relative grid min-h-[580px] lg:min-h-[640px] items-center gap-8 lg:gap-10 xl:gap-14 pb-12 sm:pb-16 pt-6 sm:pt-10 lg:grid-cols-[1.1fr_.9fr]">
        <div className="relative z-10 max-w-full">
          <div className="mb-4 sm:mb-5 inline-flex max-w-full flex-wrap items-center gap-2 border-2 border-[#171820] bg-[#f6d52b] px-3 py-1.5 font-mono text-[9px] sm:text-[10px] font-bold tracking-widest shadow-[3px_3px_0_#171820]">
            <span className="blink h-2 w-2 bg-[#e42c24] shrink-0" />
            <span>
              {settings.whitelist_open === 'false'
                ? 'WHITELIST APPLICATIONS CLOSED'
                : 'OFFICIAL 5,555 PFP WHITELIST OPEN'}
            </span>
          </div>

          <h1 className="pixel-title max-w-full text-3xl sm:text-5xl md:text-6xl lg:text-[2.85rem] xl:text-[3.75rem] 2xl:text-[4.5rem] font-black leading-[0.93]">
            NOT JUST<br />
            PIXELS.<br />
            <span className="text-[#e42c24]">PERSONALITY.</span>
          </h1>

          <p className="mt-4 sm:mt-5 max-w-[480px] text-sm sm:text-base lg:text-lg font-medium leading-relaxed text-[#394127]">
            <strong>{collection}</strong> is a character-driven 5,555 pixel-art <strong>PFP (Profile Picture) collection</strong>.
            Small pixels, bold personalities, and an exclusive holder community on Ethereum.
          </p>

          <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row flex-wrap gap-3">
            <a className="pixel-btn w-full sm:w-auto" href="#whitelist">
              APPLY FOR WHITELIST <ArrowUpRight size={17} />
            </a>
            <a className="pixel-btn light w-full sm:w-auto" href="#about">
              MEET THE PROJECT <ArrowDown size={16} />
            </a>
          </div>

          <div className="mt-8 sm:mt-9 flex items-center gap-3 sm:gap-4">
            <div className="flex -space-x-3 shrink-0">
              {['/characters/pirate-captain.jpg', '/characters/red-beanie.jpg', '/characters/fire-hero.jpg'].map(src => (
                <div key={src} className="h-10 w-10 overflow-hidden rounded-full border-2 border-[#171820] bg-[#f7f7ed]">
                  <Image src={src} alt="Pixel PFP" width={80} height={80} className="h-full w-full object-cover object-top" />
                </div>
              ))}
            </div>
            <div className="text-xs font-semibold leading-tight">
              5,555 UNIQUE PIXEL PFPS.<br />
              <span className="font-normal text-[#535744]">Your digital identity with character.</span>
            </div>
          </div>
        </div>

        {/* Hero Image Showcase */}
        <div className="relative mx-auto w-full max-w-[420px] sm:max-w-[460px] lg:max-w-[410px] xl:max-w-[470px] px-2 sm:px-0 mt-4 lg:mt-0 justify-self-center lg:justify-self-end">
          <div className="grid-bg absolute inset-0 -rotate-2 sm:-rotate-3 border-2 border-[#171820] bg-[#b2df43]" />
          <div className="relative grid grid-cols-2 items-end gap-1 px-3 pt-5 sm:px-6">
            <div className="float relative z-10 -mr-4 sm:-mr-6">
              <Image
                src="/characters/pirate-captain.jpg"
                alt="Buzquitos Pixel PFP"
                width={520}
                height={520}
                priority
                className="h-auto w-full drop-shadow-[5px_7px_0_rgba(23,24,32,.2)]"
              />
            </div>
            <div className="relative z-20 mt-12 sm:mt-18">
              <Image
                src="/characters/red-beanie.jpg"
                alt="Buzquitos Pixel PFP"
                width={520}
                height={520}
                priority
                className="float h-auto w-full [animation-delay:1s] drop-shadow-[5px_7px_0_rgba(23,24,32,.2)]"
              />
            </div>
            <div className="absolute -bottom-2 left-[28%] z-30 w-[43%]">
              <Image
                src="/characters/fire-hero.jpg"
                alt="Buzquitos Pixel PFP"
                width={520}
                height={520}
                className="h-auto w-full drop-shadow-[5px_7px_0_rgba(23,24,32,.2)]"
              />
            </div>
            <div className="absolute right-1 sm:-right-2 top-3 sm:top-5 z-30 rotate-3 sm:rotate-6 border-2 border-[#171820] bg-[#f6d52b] px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-[9px] sm:text-[10px] font-bold shadow-[3px_3px_0_#171820]">
              5,555 PIXEL PFPS ✦
            </div>
          </div>
          <div className="relative mt-4 sm:mt-5 flex items-center justify-between border-2 border-[#171820] bg-[#171820] px-3 sm:px-4 py-2.5 sm:py-3 text-white">
            <span className="eyebrow text-[10px] sm:text-[11px] truncate">YOUR NEXT FAVORITE PFP</span>
            <span className="font-mono text-[10px] sm:text-xs text-[#c2ed55] shrink-0 ml-2">[ 001 — 5555 ]</span>
          </div>
        </div>
      </section>

      {/* Marquee Banner */}
      <div className="marquee">
        <div className="marquee-track">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i}>✳ 5,555 PIXEL PFPS ✳ COMMUNITY FIRST ✳ BUZQUITOS ON X ✳ APPLY NOW ✳</span>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="section-wrap grid gap-8 sm:gap-10 py-14 sm:py-20 md:grid-cols-[.85fr_1.15fr]">
        <div>
          <div className="eyebrow mb-3 sm:mb-4">THE PFP COLLECTION / 001</div>
          <h2 className="pixel-title text-3xl sm:text-5xl lg:text-6xl font-black">
            BUILT<br />
            DIFFERENT.<br />
            <span className="text-[#e42c24]">PIXEL BY PIXEL.</span>
          </h2>
        </div>
        <div className="flex flex-col justify-center">
          <p className="max-w-2xl text-base sm:text-lg lg:text-xl font-semibold leading-relaxed">
            {collection} is a premier 5,555 pixel-art PFP collection built around distinct digital identities, bold character traits, and an active Web3 community.
          </p>
          <p className="mt-4 sm:mt-5 max-w-2xl leading-relaxed text-[#465032] text-sm sm:text-base">
            This is more than an ordinary profile picture. It is a digital collectible identity, a membership pass, and your front-row seat to the journey. Follow our official X, complete the tasks, and submit your application.
          </p>
          <div className="mt-6 sm:mt-8 grid gap-3 sm:grid-cols-3">
            <div className="border-2 border-[#171820] bg-[#f6d52b] p-4">
              <Zap />
              <b className="mt-2.5 block text-sm sm:text-base">PFP-First</b>
              <span className="text-xs">Distinct pixel personalities.</span>
            </div>
            <div className="border-2 border-[#171820] bg-[#f7f7ed] p-4">
              <ShieldCheck />
              <b className="mt-2.5 block text-sm sm:text-base">Community-Led</b>
              <span className="text-xs">Built with the holders.</span>
            </div>
            <div className="border-2 border-[#171820] bg-[#e42c24] p-4 text-white">
              <Check />
              <b className="mt-2.5 block text-sm sm:text-base">5,555 Supply</b>
              <span className="text-xs">Capped collectible supply.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section id="details" className="border-y-2 border-[#171820] bg-[#f7f7ed] py-14 sm:py-20">
        <div className="section-wrap">
          <div className="eyebrow mb-3">THE IMPORTANT BITS / 002</div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="pixel-title text-3xl sm:text-5xl lg:text-6xl font-black">
              THE<br />
              SPECS.
            </h2>
            <p className="max-w-sm text-xs sm:text-sm leading-relaxed text-[#535744]">
              The essential specs of the Buzquitos PFP collection. Final mint details will be announced through our official X account.
            </p>
          </div>
          <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {details.map(([label, value], i) => (
              <div
                key={label}
                className={`border-2 border-[#171820] p-4 sm:p-5 ${
                  i === 1 ? 'bg-[#c2ed55]' : i === 2 ? 'bg-[#f6d52b]' : 'bg-white'
                }`}
              >
                <div className="eyebrow text-[10px] sm:text-[11px]">{label}</div>
                <div className="mt-4 sm:mt-5 break-words text-2xl sm:text-3xl lg:text-4xl font-black tracking-[-.05em]">
                  {value}
                </div>
                <div className="mt-3 sm:mt-4 h-1 w-8 sm:w-10 bg-[#e42c24]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Whitelist Section */}
      <section id="whitelist" className="section-wrap grid gap-10 sm:gap-12 py-14 sm:py-22 lg:grid-cols-[.9fr_1.1fr]">
        <div className="pt-2 sm:pt-4">
          <div className="eyebrow mb-3 sm:mb-4">THE ENTRY POINT / 003</div>
          <h2 className="pixel-title text-3xl sm:text-5xl lg:text-6xl font-black">
            YOUR<br />
            PFP<br />
            <span className="text-[#e42c24]">ERA STARTS.</span>
          </h2>
          <p className="mt-4 sm:mt-6 max-w-md text-sm sm:text-base leading-relaxed text-[#465032]">
            Complete the social tasks and submit your wallet address along with your reply link. Submitting an application enters you into review, but does not guarantee a whitelist allocation.
          </p>

          <div className="mt-6 sm:mt-8 space-y-3 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center border-2 border-[#171820] bg-[#f6d52b] font-mono shrink-0">1</span>
              <span>Follow <strong>@Buzquitos</strong> on X</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center border-2 border-[#171820] bg-[#f6d52b] font-mono shrink-0">2</span>
              <span>Like, Retweet & Reply on our pinned post</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center border-2 border-[#171820] bg-[#f6d52b] font-mono shrink-0">3</span>
              <span>Submit your wallet & direct reply link below</span>
            </div>
          </div>

          <div className="mt-8 max-w-[250px] rotate-[-3deg] border-2 border-[#171820] bg-[#e42c24] p-3 text-center font-mono text-[11px] sm:text-xs font-bold text-white shadow-[4px_4px_0_#171820]">
            NO WALLET CONNECTION NEEDED ✦
          </div>
        </div>
        <WhitelistForm isOpen={settings.whitelist_open !== 'false'} />
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="border-y-2 border-[#171820] bg-[#f6d52b] py-14 sm:py-20">
        <div className="section-wrap">
          <div className="eyebrow mb-3">THE JOURNEY / 004</div>
          <h2 className="pixel-title text-3xl sm:text-5xl lg:text-6xl font-black">NEXT UP.</h2>
          <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-5 md:grid-cols-3">
            {[
              ['01', 'THE PFP DROP', 'Character reveal, whitelist distribution, and 5,555 mint launch.'],
              ['02', 'PFP COMMUNITY', 'Holder-only events, digital experiences, and avatar identity recognition.'],
              ["03", "WHAT'S NEXT", 'Future character expansions and community utility shaped by holders.']
            ].map(([n, title, desc]) => (
              <div key={n} className="border-2 border-[#171820] bg-[#f7f7ed] p-5 sm:p-6 shadow-[5px_5px_0_#171820]">
                <div className="font-mono text-3xl sm:text-4xl font-bold text-[#e42c24]">{n}</div>
                <h3 className="mt-6 sm:mt-8 text-xl sm:text-2xl font-black">{title}</h3>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-[#535744]">{desc}</p>
                <div className="mt-6 sm:mt-8 h-1 w-full bg-[#c2ed55]">
                  <div className="h-1 w-1/3 bg-[#171820]" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-[10px]">* ROADMAP ITEMS ARE PLANNING GOALS AND SUBJECT TO COMMUNITY EVOLUTION.</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section-wrap grid gap-8 sm:gap-10 py-14 sm:py-22 md:grid-cols-[.75fr_1.25fr]">
        <div>
          <div className="eyebrow mb-3 sm:mb-4">GOOD QUESTIONS / 005</div>
          <h2 className="pixel-title text-3xl sm:text-5xl lg:text-6xl font-black">
            FAQ<span className="text-[#e42c24]">.</span>
          </h2>
          <p className="mt-4 sm:mt-5 max-w-xs text-xs sm:text-sm leading-relaxed text-[#465032]">
            Answers about the Buzquitos PFP collection and whitelist process. Still curious? Find us on X.
          </p>
        </div>
        <Faq />
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-[#171820] bg-[#171820] py-8 text-white">
        <div className="section-wrap flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="font-black tracking-tight text-base sm:text-lg">
              {collection.toUpperCase()} <span className="text-[#c2ed55]">✳</span>
            </div>
            <div className="mt-1 font-mono text-[9px] sm:text-[10px] text-white/50">
              5,555 PIXEL PFP COLLECTION · SMALL PIXELS. BIG PERSONALITIES.
            </div>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-5 text-xs font-semibold">
            <a
              href={process.env.NEXT_PUBLIC_X_URL || 'https://x.com/Buzquitos'}
              target="_blank"
              rel="noreferrer"
              className="text-[#c2ed55] hover:underline"
            >
              FOLLOW @BUZQUITOS ON X ↗
            </a>
            <a href="#home" className="hover:underline">BACK TO TOP ↑</a>
          </div>
          <div className="font-mono text-[10px] text-white/45">
            © 2026 {collection}. ALL PIXELS RESERVED.
          </div>
        </div>
      </footer>
    </main>
  );
}
