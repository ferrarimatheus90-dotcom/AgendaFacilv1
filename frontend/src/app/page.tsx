"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Zap, Shield, BarChart3, ArrowRight, Check, MessageSquare, Smartphone, Cpu, HelpCircle, Globe, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const router = useRouter();

  const faqs = [
    { q: "A Evolution API está inclusa?", a: "Nós fornecemos a interface e orquestração. Você pode conectar sua própria instância da Evolution API em segundos ou usar nossa infraestrutura gerenciada nos planos Enterprise." },
    { q: "Quais modelos de IA posso usar?", a: "Oferecemos suporte oficial ao Claude 3.5 Sonnet (melhor raciocínio) e GPT-4o, garantindo que você tenha o melhor cérebro para seu negócio." },
    { q: "O agente consegue transferir para um humano?", a: "Sim! Você pode configurar palavras-chave ou regras para que a IA pause o atendimento e libere para sua equipe humana intervir no dashboard." },
    { q: "É seguro para meu número de WhatsApp?", a: "Sim, utilizamos a tecnologia mais estável do mercado, simulando o comportamento do WhatsApp Web para minimizar riscos de banimento." },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-[#e8e9ed] selection:bg-accent/30 font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[150px] rounded-full animate-pulse delay-75" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050608]/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-accent/20 transition-transform hover:scale-110">
              <Bot className="w-6 h-6 text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">AgentFlow</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-10 text-sm font-medium text-text-muted">
            <a href="#features" className="hover:text-accent transition-all hover:translate-y-[-1px]">Funcionalidades</a>
            <a href="#how-it-works" className="hover:text-accent transition-all hover:translate-y-[-1px]">Como funciona</a>
            <a href="#pricing" className="hover:text-accent transition-all hover:translate-y-[-1px]">Preços</a>
            <a href="#faq" className="hover:text-accent transition-all hover:translate-y-[-1px]">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold hover:text-white transition-colors px-4 py-2">
              Login
            </Link>
            <Link href="/register">
              <Button className="bg-accent hover:bg-accent/90 text-black font-bold px-6 h-11 rounded-xl shadow-lg shadow-accent/10 transition-all active:scale-95">
                Começar agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-44 pb-32 overflow-hidden px-6">
          <div className="container mx-auto text-center max-w-5xl">
            <Badge variant="outline" className="mb-6 py-1.5 px-4 bg-white/5 text-accent border-accent/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Zap className="w-3.5 h-3.5 mr-2 fill-accent" />
              O Futuro do Atendimento via WhatsApp no Ar
            </Badge>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.05] animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Seu WhatsApp no <br />
              <span className="text-gradient">Piloto Automático</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000">
              Agentes de IA que leem, entendem e respondem seus clientes 24/7 com inteligência comparável à humana.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <Link href="/register">
                <Button size="lg" className="h-16 px-10 text-lg font-black bg-accent hover:bg-accent/90 text-black rounded-2xl shadow-2xl shadow-accent/20 group">
                  Criar Agente Grátis
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="h-16 px-10 text-lg font-bold border-white/10 hover:bg-white/5 rounded-2xl backdrop-blur-sm">
                  Ver Demonstração
                </Button>
              </Link>
            </div>

            {/* Dashboard Preview */}
            <div className="mt-24 relative p-2 md:p-4 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-sm animate-in zoom-in-95 duration-1000">
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050608] to-transparent z-10" />
              <div className="rounded-[24px] overflow-hidden border border-white/5">
                <img 
                  src="https://images.unsplash.com/photo-1611746872915-64382b5c76da?q=80&w=2070&auto=format&fit=crop" 
                  alt="Dashboard Preview" 
                  className="w-full h-auto object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-6xl font-black mb-6">Funcionalidades para <br /><span className="text-accent underline decoration-accent/20 underline-offset-8">escalar de verdade</span></h2>
                <p className="text-lg text-text-muted leading-relaxed">Não é apenas um bot. É um funcionário digital ultra-treinado rodando no seu WhatsApp.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-white/40" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-10 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-accent/30 transition-all duration-500 hover:translate-y-[-8px]">
                <div className="w-16 h-16 rounded-[22px] bg-accent/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Geração de Leads</h3>
                <p className="text-text-muted leading-relaxed">A IA conversa, qualifica e extrai dados dos seus leads automaticamente 24h por dia.</p>
              </div>

              <div className="group p-10 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-accent/30 transition-all duration-500 hover:translate-y-[-8px]">
                <div className="w-16 h-16 rounded-[22px] bg-accent/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Atendimento Humano</h3>
                <p className="text-text-muted leading-relaxed">Transborde para humanos em segundos quando a IA detectar a necessidade.</p>
              </div>

              <div className="group p-10 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-accent/30 transition-all duration-500 hover:translate-y-[-8px]">
                <div className="w-16 h-16 rounded-[22px] bg-accent/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Segurança Enterprise</h3>
                <p className="text-text-muted leading-relaxed">Criptografia de ponta a ponta e total conformidade com a LGPD e privacidade.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 px-6 bg-[#08090d]">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <Badge variant="outline" className="mb-4 py-1 px-4 border-accent/20 text-accent">PLANOS E PREÇOS</Badge>
              <h2 className="text-4xl md:text-6xl font-black mb-6">Investimento que se paga</h2>
              <p className="text-lg text-text-muted max-w-xl mx-auto">Comece gratuitamente e escolha o plano que melhor se adapta à sua jornada.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-10 rounded-[48px] bg-[#0c0d12] border border-white/5 flex flex-col hover:border-white/10 transition-all">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black text-white">R$ 0</span>
                  <span className="text-text-muted text-sm font-medium">/mês</span>
                </div>
                <ul className="space-y-6 mb-12 flex-1">
                  {["1 Agente", "GPT-4o Mini", "50 mensagens/mês", "Comunidade Discord"].map(f => (
                    <li key={f} className="flex items-center gap-4 text-sm font-medium text-text-muted">
                      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white/50" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full h-14 rounded-2xl font-bold" onClick={() => router.push("/register")}>Começar Grátis</Button>
              </div>

              <div className="p-10 rounded-[48px] bg-gradient-to-b from-[#12141c] to-[#0c0d12] border border-accent/40 flex flex-col relative scale-105 shadow-2xl shadow-accent/10">
                <div className="absolute top-6 right-8 bg-accent text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">MELHOR VALOR</div>
                <h3 className="text-xl font-bold mb-2 text-accent">Pro</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-5xl font-black text-white">R$ 197</span>
                  <span className="text-text-muted text-sm font-medium">/mês</span>
                </div>
                <ul className="space-y-6 mb-12 flex-1">
                  {["5 Agentes", "Claude 3.5 Sonnet", "Mensagens Ilimitadas*", "Analytics Pro", "WhatsApp Integrado"].map(f => (
                    <li key={f} className="flex items-center gap-4 text-sm font-bold text-white/90">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full h-14 rounded-2xl font-black bg-accent hover:bg-accent/90 text-black shadow-lg shadow-accent/20" onClick={() => router.push("/register")}>Assinar Agora</Button>
              </div>

              <div className="p-10 rounded-[48px] bg-[#0c0d12] border border-white/5 flex flex-col hover:border-white/10 transition-all">
                <h3 className="text-xl font-bold mb-2">Social</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-black text-white">R$ 497</span>
                  <span className="text-text-muted text-sm font-medium">/mês</span>
                </div>
                <ul className="space-y-6 mb-12 flex-1">
                  {["20 Agentes", "Todos os Modelos", "IA de Voz Integrada", "Gerente de Conta", "White Label (Breve)"].map(f => (
                    <li key={f} className="flex items-center gap-4 text-sm font-medium text-text-muted">
                      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white/50" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full h-14 rounded-2xl font-bold" onClick={() => router.push("/register")}>Falar com Vendas</Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 px-6">
          <div className="container mx-auto max-w-4xl">
             <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black mb-6">Ficou alguma dúvida?</h2>
              <p className="text-text-muted">Estamos aqui para ajudar você a automatizar com confiança.</p>
            </div>
            <div className="grid gap-6">
              {faqs.map((f, i) => (
                <div key={i} className="group p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                  <h4 className="text-xl font-bold mb-3 flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-accent opacity-50 group-hover:opacity-100 transition-opacity" />
                    {f.q}
                  </h4>
                  <p className="text-text-muted leading-relaxed pl-8">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="relative p-12 md:p-24 rounded-[64px] bg-gradient-to-br from-accent to-accent-dark text-black text-center overflow-hidden shadow-2xl shadow-accent/20">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 blur-[100px] -mr-40 -mt-40 rounded-full" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 blur-[100px] -ml-40 -mb-40 rounded-full" />
              
              <h2 className="text-4xl md:text-6xl font-[1000] mb-8 relative z-10 leading-tight tracking-tighter">Pronto para<br />automatizar suas vendas?</h2>
              <p className="text-xl md:text-2xl font-bold mb-12 opacity-80 relative z-10">Junte-se a centenas de empresas que já escalam com IA.</p>
              
              <Link href="/register">
                <Button size="lg" className="h-20 px-12 text-2xl font-black bg-black text-accent hover:bg-black/90 rounded-[28px] shadow-2xl relative z-10 transition-transform active:scale-95">
                  Começar agora grátis
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#030406]">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <span className="font-bold text-2xl tracking-tighter text-white">AgentFlow</span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed max-w-xs mb-8">
                O AgentFlow é o cérebro por trás de alguns dos sistemas de atendimento automático mais eficientes do país.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-black cursor-pointer transition-all">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent hover:text-black cursor-pointer transition-all">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="lg:col-start-4">
              <h5 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">Produto</h5>
              <ul className="space-y-4 text-sm text-text-muted">
                <li><a href="#features" className="hover:text-accent transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-accent transition-colors">Preços</a></li>
                <li><a href="/login" className="hover:text-accent transition-colors">Log In</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">Empresa</h5>
              <ul className="space-y-4 text-sm text-text-muted">
                <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contato</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">Jurídico</h5>
              <ul className="space-y-4 text-sm text-text-muted">
                <li><a href="#" className="hover:text-accent transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-text-muted font-medium">
            <span>© 2026 AgentFlow Inteligência Artificial Ltda.</span>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                Sistemas operacionais
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .text-gradient {
          background: linear-gradient(135deg, #00d4aa 0%, #00a884 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
