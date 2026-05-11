import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ChevronDown,
  Image as ImageIcon,
  LineChart,
  Lock,
  MessageCircle,
  Package,
  Smartphone,
  Sparkles,
  Store,
  Wallet,
  Wand2,
  Zap
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { panelUrl } from "../shared/utils/hostname";

const FOUNDERS_LOT_TOTAL = 100;
const FOUNDERS_LOT_REMAINING = 87;

const trialUrl = () => {
  const base = panelUrl();
  return base.endsWith("/") ? `${base}cadastro-trial` : `${base}/cadastro-trial`;
};

const loginHref = () => {
  const base = panelUrl();
  return base.endsWith("/") ? `${base}login` : `${base}/login`;
};

export function LandingPage() {
  const trial = trialUrl();
  const demoUrl = `${window.location.origin}/?tenant=feitoemcasa`;

  return (
    <main className="min-h-screen bg-[#f7f7f1] text-slate-950">
      <Header trial={trial} />

      <Hero trial={trial} demoUrl={demoUrl} />

      <SocialProofBar />

      <ProblemSection />

      <SolutionSection />

      <BenefitsSection />

      <ProofSection />

      <HowItWorksSection trial={trial} />

      <OfferStackSection trial={trial} />

      <GuaranteeSection />

      <QualifierSection />

      <FaqSection />

      <FinalCtaSection trial={trial} />

      <Footer />

      <StickyMobileCta trial={trial} />
    </main>
  );
}

function Header({ trial }: { trial: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f7f7f1]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="/" className="flex items-center gap-3" aria-label="UMenu">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
            <Store className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">UMenu</span>
        </a>
        <a
          href={trial}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          Testar 7 dias grátis
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}

function Hero({ trial, demoUrl }: { trial: string; demoUrl: string }) {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-800">
          <Sparkles className="h-3.5 w-3.5" />
          Pra salgaderia, confeitaria caseira e marmita
        </p>
        <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-[64px]">
          O cardápio dos seus salgados, vendendo pelo WhatsApp em 5 minutos.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-7 text-slate-600">
          Crie um cardápio digital próprio (<span className="font-semibold text-slate-900">seunegocio.umenu.com.br</span>),
          publique pelo celular, e receba os pedidos prontos no seu WhatsApp.
          Sem comissão. Sem programador. Sem cartão pra testar.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={trial}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
          >
            Quero meu cardápio grátis por 7 dias
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href={demoUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:border-orange-300 hover:bg-orange-50"
          >
            Ver cardápio exemplo
          </a>
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Lock className="h-3.5 w-3.5" />
          Sem cartão · Cancela quando quiser · 5 minutos pra publicar
        </p>
      </div>

      <HeroPreview />
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -left-6 top-10 hidden h-28 w-28 rounded-full bg-orange-200/70 blur-3xl lg:block" />
      <div className="absolute -right-8 bottom-8 hidden h-32 w-32 rounded-full bg-green-200/70 blur-3xl lg:block" />
      <div className="relative grid gap-3 sm:grid-cols-2">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-xs font-bold text-slate-950">Feito em Casa</p>
              <p className="text-[10px] text-slate-500">feitoemcasa.umenu.com.br</p>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Aberto</span>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {[
              ["Pastel", "R$ 110/cento", "bg-orange-100"],
              ["Coxinha", "R$ 130/cento", "bg-amber-100"],
              ["Brigadeiro", "R$ 160/cento", "bg-pink-100"],
              ["Lasanha", "R$ 50/kg", "bg-red-100"]
            ].map(([name, price, bg]) => (
              <div key={name} className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className={`flex aspect-square items-center justify-center rounded-lg ${bg}`}>
                  <Package className="h-7 w-7 text-slate-700" />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-950">{name}</p>
                <p className="text-[10px] font-semibold text-orange-700">{price}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden flex-col gap-3 sm:flex">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-xl">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp · Maria
            </div>
            <p className="text-sm leading-6">
              Olá! Pedido de Maria:
              <br />
              <span className="text-green-300">100x Pastel — R$ 110,00</span>
              <br />
              <span className="text-green-300">50x Brigadeiro — R$ 80,00</span>
              <br />
              <strong className="text-white">Total: R$ 190,00</strong>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Esta semana</p>
            <p className="mt-1 text-2xl font-black text-slate-950">R$ 1.840</p>
            <p className="text-xs text-slate-500">12 pedidos · 89 acessos · 13% conversão</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialProofBar() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-5 py-5 text-sm font-semibold text-slate-600 sm:gap-10 sm:px-8">
        <span>🍴 Salgaderias</span>
        <span>🍰 Confeitarias caseiras</span>
        <span>🥘 Marmitas</span>
        <span>🍕 Pizzarias de bairro</span>
        <span className="hidden text-slate-400 sm:inline">·</span>
        <span className="text-orange-700">cardápio publicado em até 5 minutos</span>
      </div>
    </section>
  );
}

function ProblemSection() {
  const pains = [
    "Você manda o PDF antigo e o cliente abre cortado no celular — e desiste.",
    "Atualizou o preço do cento, mas esqueceu de avisar a galera do grupo.",
    "Tentou iFood/Goomer e descobriu que cobram comissão em produto sob encomenda.",
    "Manda lista digitada e o cliente pergunta: 'tem foto?'",
    "Vê concorrente com cardápio bonito e pensa: 'isso deve custar uns R$ 1.500'.",
    "Quer parecer profissional sem aprender Wix, Canva e mais 3 ferramentas."
  ];

  return (
    <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Você reconhece alguma dessas?</h2>
      <ul className="mt-10 grid gap-5 md:grid-cols-2">
        {pains.map((pain) => (
          <li key={pain} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5">
            <span aria-hidden className="mt-0.5 text-xl">😵</span>
            <p className="text-base leading-7 text-slate-700">{pain}</p>
          </li>
        ))}
      </ul>
      <p className="mt-10 max-w-3xl text-lg italic leading-7 text-slate-700">
        Salgaderia caseira não é restaurante. Você não precisa de um sistema de PDV.
        Você precisa de uma <strong className="not-italic">vitrine que o cliente abre e fecha o pedido</strong>.
      </p>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className="border-y border-slate-200 bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <p className="text-sm font-bold uppercase tracking-wide text-orange-300">A solução</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          UMenu é o cardápio que vende sozinho.
        </h2>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
          A gente fez UMenu pra quem fecha pedido na conversa.
          Você cria o cardápio em 5 minutos pelo painel. Ele fica no ar com URL própria.
          Você manda esse link no Stories, no Status, no Direct.
        </p>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
          O cliente abre, escolhe os salgados, monta o carrinho — e a mensagem chega <strong className="text-white">pronta no seu WhatsApp</strong>.
          Você só responde "fechado, qual horário?". Sem comissão. Sem fricção.
        </p>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const benefits: { icon: ReactNode; title: string; description: string }[] = [
    {
      icon: <Store className="h-5 w-5" />,
      title: "Subdomínio próprio",
      description: "seunegocio.umenu.com.br — fácil de memorizar, fácil de compartilhar."
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: "Pedido formatado no WhatsApp",
      description: "O carrinho do cliente vira mensagem pronta no seu número."
    },
    {
      icon: <Package className="h-5 w-5" />,
      title: "Carrinho com mínimo, cento e kg",
      description: "Tipos de preço prontos pra salgado, doce e marmita."
    },
    {
      icon: <Wand2 className="h-5 w-5" />,
      title: "Foto Pro com IA",
      description: "5 créditos de boas-vindas. Foto bonita sem câmera profissional."
    },
    {
      icon: <LineChart className="h-5 w-5" />,
      title: "Dashboard simples",
      description: "Quantos viram seu cardápio, quantos pediram, qual a conversão."
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      title: "Sem comissão por venda",
      description: "Mensalidade fixa. iFood não cobre. O dinheiro do pedido é todo seu."
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Edição em segundos",
      description: "Mudou preço? Edita do celular, atualiza pra todo mundo na hora."
    },
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Feito pra celular",
      description: "Layout que abre rápido e parece profissional no Instagram."
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <h2 className="text-4xl font-black tracking-tight sm:text-5xl">O que você ganha hoje, ainda no trial.</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              {item.icon}
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-950">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="border-y border-slate-200 bg-white py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-orange-700">Quem já vende com UMenu</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            "Faturei mais nessa semana do que no mês passado inteiro."
          </h2>
          <p className="mt-6 text-lg leading-7 text-slate-700">
            Antes eu mandava print do PDF e o cliente sumia. Hoje eu mando 1 link, o pedido cai pronto no
            meu WhatsApp e eu só respondo.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">Nilceia</p>
              <p className="text-xs text-slate-500">Feito em Casa · Curitiba/PR</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProofCard icon={<ImageIcon />} label="Produtos cadastrados" value="56" />
          <ProofCard icon={<Package />} label="Categorias" value="9" />
          <ProofCard icon={<Zap />} label="Tempo até publicar" value="4 min" />
          <ProofCard icon={<MessageCircle />} label="Pedidos no WhatsApp" value="100%" />
        </div>
      </div>
    </section>
  );
}

function ProofCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f7f7f1] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600">{icon}</div>
      <p className="mt-4 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function HowItWorksSection({ trial }: { trial: string }) {
  const steps = [
    {
      number: "1",
      title: "Cria a conta",
      description: "Nome do negócio, subdomínio que você quer, WhatsApp. Em 30 segundos."
    },
    {
      number: "2",
      title: "Adiciona produtos",
      description: "Categoria, foto, preço, mínimo. Tem 50 descrições prontas pra copiar."
    },
    {
      number: "3",
      title: "Compartilha o link",
      description: "Stories, Status, Direct, Bio. O pedido cai pronto no seu WhatsApp."
    }
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Em 5 minutos seu cardápio está no ar.</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.number} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-base font-black text-white">
              {step.number}
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-950">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <a
          href={trial}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700"
        >
          Começar agora
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function OfferStackSection({ trial }: { trial: string }) {
  const stack: { title: string; value: string; included?: boolean }[] = [
    { title: "Vitrine Própria com subdomínio", value: "R$ 800/ano" },
    { title: "Catálogo Vendedor (produtos, fotos, preços)", value: "incluso", included: true },
    { title: "Pedido Pronto pelo WhatsApp", value: "R$ 600/ano" },
    { title: "Painel Mãe (edição em segundos)", value: "incluso", included: true },
    { title: "Métricas Reais (acessos, pedidos, conversão)", value: "R$ 240/ano" }
  ];

  const bonuses = [
    { title: "🎁 Bônus: 5 créditos Foto Pro com IA", value: "R$ 50" },
    { title: "🎁 Bônus: Vídeo \"Cardápio no ar em 5 minutos\"", value: "R$ 0" },
    { title: "🎁 Bônus: 50 descrições prontas pra copiar", value: "R$ 50" }
  ];

  return (
    <section className="border-y border-slate-200 bg-white py-20">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <p className="text-sm font-bold uppercase tracking-wide text-orange-700">Plano Essencial</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          O que vem dentro.
        </h2>

        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f7f1]">
          <div className="divide-y divide-slate-200">
            {stack.map((item) => (
              <StackRow key={item.title} title={item.title} value={item.value} included={item.included} />
            ))}
            {bonuses.map((bonus) => (
              <StackRow key={bonus.title} title={bonus.title} value={bonus.value} bonus />
            ))}
            <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">
              <p className="text-sm font-semibold uppercase tracking-wide">Valor total</p>
              <p className="text-xl font-black">R$ 1.740 / ano</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <PlanCard
            title="Mensal"
            price="R$ 97"
            unit="/ mês"
            description="Cancela quando quiser. Cobrança recorrente."
            cta="Começar grátis"
            trial={trial}
          />
          <PlanCard
            title="Anual · Founders Lot"
            price="R$ 197"
            unit="/ ano"
            description={`Equivale a R$ 16,40/mês. Limitado às primeiras ${FOUNDERS_LOT_TOTAL} contas. Restam ${FOUNDERS_LOT_REMAINING}.`}
            cta="Garantir minha vaga"
            trial={trial}
            highlight
          />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Você decide o plano <strong>só depois</strong> dos 7 dias. Sem cartão pra começar.
        </p>
      </div>
    </section>
  );
}

function StackRow({
  title,
  value,
  included,
  bonus
}: {
  title: string;
  value: string;
  included?: boolean;
  bonus?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 px-5 py-3 ${bonus ? "bg-amber-50/40" : ""}`}>
      <p className="flex-1 text-sm font-medium text-slate-800">{title}</p>
      <p className={`shrink-0 text-sm font-bold ${included ? "text-green-700" : "text-slate-700"}`}>{value}</p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  unit,
  description,
  cta,
  trial,
  highlight = false
}: {
  title: string;
  price: string;
  unit: string;
  description: string;
  cta: string;
  trial: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight ? "border-orange-500 bg-orange-50 shadow-xl shadow-orange-200/40" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-bold uppercase tracking-wide ${highlight ? "text-orange-700" : "text-slate-500"}`}>
          {title}
        </p>
        {highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            <BadgeCheck className="h-3 w-3" />
            Recomendado
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-5xl font-black tracking-tight text-slate-950">{price}</span>
        <span className="text-sm font-semibold text-slate-500">{unit}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <a
        href={trial}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
          highlight ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-slate-950 text-white hover:bg-slate-800"
        }`}
      >
        {cta}
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}

function GuaranteeSection() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
      <div className="rounded-3xl border-2 border-dashed border-orange-300 bg-orange-50/60 p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white">
          <BadgeCheck className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">7 dias grátis. Sem cartão.</h2>
        <p className="mt-4 text-lg leading-7 text-slate-700">
          Você cria o cardápio, publica e manda pros seus clientes. Se gostou, escolhe o plano e paga.
          Se não gostou, fecha a aba e some sem digitar nada. Nem <strong>R$ 1</strong>.
        </p>
      </div>
    </section>
  );
}

function QualifierSection() {
  const not = [
    "Você tem 4+ lojas franqueadas e precisa de PDV/ERP integrado.",
    "Você quer pagamento online e roteirização de motoboy.",
    "Você prefere vender pelo iFood mesmo pagando comissão."
  ];

  return (
    <section className="border-y border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <h2 className="text-3xl font-black tracking-tight">UMenu <span className="text-red-600">não</span> é pra você se…</h2>
        <ul className="mt-6 space-y-3 text-base leading-7 text-slate-700">
          {not.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-base leading-7 text-slate-700">
          UMenu é pra quem <strong>fecha pedido na conversa</strong> e quer um cardápio que parece profissional, sem complicação.
        </p>
      </div>
    </section>
  );
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "Preciso de cartão pra testar?",
    a: "Não. 7 dias grátis sem cartão. Se gostou, você escolhe mensal ou anual e cadastra."
  },
  {
    q: "Como o cliente faz o pedido?",
    a: "Ele abre seu cardápio no celular (seunegocio.umenu.com.br), monta o carrinho e clica em \"Finalizar pelo WhatsApp\". A mensagem chega no seu número já formatada — você só responde."
  },
  {
    q: "UMenu cobra comissão por venda?",
    a: "Não. Nunca. A mensalidade é fixa. O dinheiro do pedido vai 100% pra você."
  },
  {
    q: "Funciona pra salgado/cento/quilo?",
    a: "Sim. Tem tipo de preço por unidade, cento e kg, com mínimo e incremento configuráveis (ex: mínimo 25 salgados, em incremento de 25)."
  },
  {
    q: "E se eu quiser cancelar?",
    a: "No mensal, cancela quando quiser pelo painel — segue ativo até o fim do mês pago. No anual, cancela e a gente devolve proporcional aos meses não usados."
  },
  {
    q: "Posso mudar a foto depois?",
    a: "Sim. Edita pelo celular. A alteração aparece no cardápio na hora. Se a foto não está boa, usa um crédito Foto Pro com IA — a gente melhora pra você."
  },
  {
    q: "Posso ter mais de uma pessoa editando?",
    a: "Sim. Você pode adicionar quem ajuda você (sócia, marido, mãe) com login próprio."
  }
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
      <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Perguntas frequentes</h2>
      <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {FAQS.map((faq, index) => {
          const open = openIndex === index;
          return (
            <button
              key={faq.q}
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              className="flex w-full flex-col gap-3 px-5 py-4 text-left"
              aria-expanded={open}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-bold text-slate-950">{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
                />
              </div>
              {open && <p className="text-sm leading-6 text-slate-600">{faq.a}</p>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FinalCtaSection({ trial }: { trial: string }) {
  return (
    <section className="border-t border-slate-200 bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <p className="text-sm font-bold uppercase tracking-wide text-orange-300">Última chance de pular</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Hoje à noite seu cardápio pode estar nos Stories.
        </h2>
        <p className="mt-5 text-lg leading-7 text-slate-300">
          Você levou 8 minutos lendo isso. Em mais 5 o seu cardápio está no ar.
        </p>
        <a
          href={trial}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-4 text-base font-bold text-white shadow-2xl shadow-orange-600/30 transition hover:bg-orange-700"
        >
          Quero meu cardápio grátis por 7 dias
          <ArrowRight className="h-5 w-5" />
        </a>
        <p className="mt-4 text-xs text-slate-400">
          Sem cartão · Cancela quando quiser · Sem comissão por venda
        </p>
        <p className="mt-2 text-xs text-orange-300">
          Restam {FOUNDERS_LOT_REMAINING} de {FOUNDERS_LOT_TOTAL} vagas no Founders Lot anual de R$ 197.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 py-8 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
        <div className="flex items-center gap-2 text-sm">
          <Store className="h-4 w-4 text-orange-400" />
          <span>UMenu · Cardápio digital pra quem vende pelo WhatsApp</span>
        </div>
        <div className="flex gap-5 text-xs">
          <a href={loginHref()} className="hover:text-white">Entrar</a>
          <span>© {new Date().getFullYear()} UMenu</span>
        </div>
      </div>
    </footer>
  );
}

function StickyMobileCta({ trial }: { trial: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-2xl shadow-slate-300/40 lg:hidden">
      <a
        href={trial}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white"
      >
        Testar 7 dias grátis
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
