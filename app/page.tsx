"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Types TypeScript
interface FormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  startup: string;
  ateliers: string[];
}

interface Errors {
  [key: string]: string;
}

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
}

// ✅ Composant Input
function FormInput({ label, name, type = "text", value, onChange, error }: FormInputProps) {
  return (
    <div>
      <input
        type={type}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={`w-full border p-4 rounded-xl outline-none focus:ring-2 transition text-lg ${
          error ? "border-red-500 focus:ring-red-500" : "focus:ring-black"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    poste: "",
    startup: "",
    ateliers: [],
  });

  const [errors, setErrors] = useState<Errors>({});

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateStep2 = (): boolean => {
    const newErrors: Errors = {};
    if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est requis";
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.telephone.trim()) newErrors.telephone = "Le téléphone est requis";
    if (!formData.poste.trim()) newErrors.poste = "Le poste est requis";
    if (!formData.startup.trim()) newErrors.startup = "Le nom de la startup est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    if (formData.ateliers.length === 0) {
      setErrors({ ateliers: "Veuillez sélectionner au moins un atelier" });
      return false;
    }
    setErrors({});
    return true;
  };

  const nextStep = () => {
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(s => Math.min(s + 1, 4));
  };

  const prevStep = () => {
    setStep(s => Math.max(s - 1, 1));
    setErrors({});
  };

  // ✅ Submit - Supabase + Formspree
  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/inscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || 'Erreur sauvegarde Supabase');
      }

      const supabaseData = await res.json();
      console.log('✅ Données sauvegardées dans Supabase:', supabaseData);

      const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;
      if (endpoint) {
        const mailRes = await fetch(endpoint.trim(), {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            ateliers: formData.ateliers.join(', '),
            _subject: '🎉 Nouvelle inscription - Ateliers Startups',
            _replyto: formData.email,
          }),
        });
        
        if (!mailRes.ok) {
          console.warn('⚠️ Erreur Formspree (non bloquante)');
        }
      }

      setStep(4);
      
    } catch (err: any) {
      console.error('💥 Erreur:', err);
      setErrors({ form: err.message || 'Impossible d\'envoyer le formulaire.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((step - 1) / totalSteps) * 100;

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4 md:p-8">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-8 md:p-12 lg:p-16">
        
        {/* Progress bar */}
        {step <= totalSteps && (
          <div className="mb-8 md:mb-12">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span className="text-base md:text-lg">Étape {step} / {totalSteps}</span>
              <span className="text-base md:text-lg">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full">
              <div className="bg-black h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1 - STRUCTURÉE EN 3 PARTIES */}
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }} 
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              
              {/* ✅ LOGO HEADER - TOUT EN HAUT */}
              <div className="flex justify-center mb-4 md:mb-6">
                <img 
                  src="/logos/header.jpeg" 
                  alt="Logo header" 
                  className="w-[180%] md:w-[180%] h-auto object-contain"
                />
              </div>

              {/* ✅ TEXTE "FORMULAIRE D'INSCRIPTION" */}
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-700">
                  Formulaire d'inscription
                </h2>
                <div className="w-16 h-1 bg-black mx-auto rounded-full mt-3"></div>
              </div>

              {/* ✅ HEADER */}
              <header className="text-center mb-8 md:mb-10">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  🚀 Ateliers dédiés aux startups
                </h1>
                <div className="w-24 h-1 bg-black mx-auto rounded-full"></div>
              </header>

              {/* ✅ BODY */}
              <section className="flex-1 mb-8 md:mb-10">
                {/* Description */}
                <p className="mb-8 text-gray-600 leading-relaxed text-lg md:text-xl text-center max-w-2xl mx-auto">
                  Accélérez le développement de votre startup grâce à deux ateliers stratégiques.
                </p>
                
                {/* Liste des ateliers */}
                <ul className="mb-10 space-y-4 text-gray-700 text-lg md:text-xl max-w-xl mx-auto">
                  <li className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                    <span className="text-2xl">🇪🇺</span>
                    <span>Réussir son appel à projet Européen</span>
                  </li>
                  <li className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                    <span className="text-2xl">📈</span>
                    <span>Go to market : vendre à ses premiers clients</span>
                  </li>
                </ul>
                
                {/* Logo partenaires */}
                <div className="mb-8">
                  <p className="text-base md:text-lg text-gray-500 font-semibold mb-6 text-center">
                   
                  </p>
                  <div className="flex justify-center items-center bg-gray-50 rounded-xl p-6">
                    <img 
                      src="/logos/logo.jpeg" 
                      alt="Nos partenaires" 
                      className="w-full max-w-3xl h-auto object-contain"
                    />
                  </div>
                </div>
              </section>

              {/* ✅ FOOTER */}
              <footer className="border-t border-gray-200 pt-6 md:pt-8">
                <button 
                  onClick={nextStep} 
                  className="w-full bg-black text-white py-4 md:py-5 rounded-xl hover:opacity-90 transition text-lg md:text-xl font-semibold shadow-lg hover:shadow-xl"
                >
                  Je m'inscris
                </button>
                <p className="text-center text-gray-400 text-sm mt-4">
                  Durée estimée : 45 secondes • Inscription gratuite
                </p>
              </footer>

            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-center">👤 Vos informations</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                <FormInput label="Nom" name="nom" value={formData.nom} onChange={handleChange} error={errors.nom} />
                <FormInput label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} error={errors.prenom} />
                <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
                <FormInput label="Téléphone" name="telephone" value={formData.telephone} onChange={handleChange} error={errors.telephone} />
                <FormInput 
                  label="Poste occupé" 
                  name="poste" 
                  value={formData.poste} 
                  onChange={handleChange} 
                  error={errors.poste}
                />
                <FormInput 
                  label="Nom de la startup" 
                  name="startup" 
                  value={formData.startup} 
                  onChange={handleChange} 
                  error={errors.startup}
                />
              </div>

              <div className="flex justify-between pt-6">
                <button 
                  onClick={prevStep} 
                  className="text-gray-500 hover:text-black transition text-lg px-6 py-3"
                >
                  ← Retour
                </button>
                <button 
                  onClick={nextStep} 
                  className="bg-black text-white px-8 py-3 md:px-10 md:py-4 rounded-xl hover:opacity-90 transition text-lg font-semibold"
                >
                  Suivant →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 text-center">🎓 Sélectionnez vos ateliers</h2>
              
              <div className="space-y-4 mb-8">
                {["🇪🇺 Réussir son appel à projet Européen", "📈 Go to market : vendre à ses premiers clients"].map(atelier => (
                  <label key={atelier} className="flex items-center gap-4 border-2 p-6 rounded-xl hover:bg-gray-50 transition cursor-pointer text-lg md:text-xl">
                    <input
                      type="checkbox"
                      checked={formData.ateliers.includes(atelier)}
                      onChange={e => {
                        if (e.target.checked) setFormData(prev => ({ ...prev, ateliers: [...prev.ateliers, atelier] }));
                        else setFormData(prev => ({ ...prev, ateliers: prev.ateliers.filter(a => a !== atelier) }));
                      }}
                      className="w-6 h-6 accent-black"
                    />
                    <span className="text-gray-700 flex-1">{atelier}</span>
                  </label>
                ))}
              </div>
              
              {errors.ateliers && <p className="text-red-500 text-base mb-4">{errors.ateliers}</p>}
              {errors.form && <p className="text-red-500 text-base mb-4 bg-red-50 p-4 rounded-lg">{errors.form}</p>}
              
              <div className="flex justify-between">
                <button 
                  onClick={prevStep} 
                  className="text-gray-500 hover:text-black transition text-lg px-6 py-3" 
                  disabled={isSubmitting}
                >
                  ← Retour
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || formData.ateliers.length === 0} 
                  className={`px-8 py-3 md:px-10 md:py-4 rounded-xl transition flex items-center gap-2 text-lg font-semibold ${
                    isSubmitting || formData.ateliers.length === 0 
                      ? "bg-gray-300 cursor-not-allowed" 
                      : "bg-black text-white hover:opacity-90"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : "Valider ✓"}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center py-8 md:py-12">
              <div className="text-7xl md:text-8xl mb-6">🎉</div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Merci pour votre inscription !</h2>
              <p className="text-gray-600 mb-8 text-lg md:text-xl">Vous recevrez un email de confirmation sous peu.</p>
              
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 text-left space-y-4 text-lg md:text-xl max-w-2xl mx-auto">
                <p><strong>👤 Nom :</strong> {formData.prenom} {formData.nom}</p>
                <p><strong>📧 Email :</strong> {formData.email}</p>
                <p><strong>💼 Poste :</strong> {formData.poste}</p>
                <p><strong>🚀 Startup :</strong> {formData.startup}</p>
                <p><strong>🎓 Ateliers :</strong> {formData.ateliers.join(", ")}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}