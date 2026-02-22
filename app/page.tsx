"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Types TypeScript - MODIFIÉS
interface FormData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;           // ← Remplace "pays"
  startup: string;         // ← Remplace "adresse"
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

// ✅ Composant Input (inchangé)
function FormInput({ label, name, type = "text", value, onChange, error }: FormInputProps) {
  return (
    <div>
      <input
        type={type}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={`w-full border p-3 rounded-xl outline-none focus:ring-2 transition ${
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

  // ✅ State formData - MODIFIÉ
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    poste: "",              // ← Nouveau champ
    startup: "",            // ← Nouveau champ
    ateliers: [],
  });

  const [errors, setErrors] = useState<Errors>({});

  // ❌ useEffect pour les pays SUPPRIMÉ (plus nécessaire)

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // ✅ Validation Step 2 - MODIFIÉE
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
    if (!formData.poste.trim()) newErrors.poste = "Le poste est requis";      // ← Nouveau
    if (!formData.startup.trim()) newErrors.startup = "Le nom de la startup est requis";  // ← Nouveau
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
      // 1️⃣ Sauvegarde dans Supabase via API route
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

      // 2️⃣ Envoi email via Formspree
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

      setStep(4); // Étape de confirmation
      
    } catch (err: any) {
      console.error('💥 Erreur:', err);
      setErrors({ form: err.message || 'Impossible d\'envoyer le formulaire.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((step - 1) / totalSteps) * 100;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-6">
      <div className="w-full max-w-xl bg-white shadow-2xl rounded-2xl p-10">
        {/* Progress bar */}
        {step <= totalSteps && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Étape {step} / {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div className="bg-black h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1 */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <h1 className="text-3xl font-bold mb-4">🚀 bienvenue au MBA dédiés aux startups</h1>
              <p className="mb-6 text-gray-600 leading-relaxed">Accélérez le développement de votre startup grâce à deux ateliers stratégiques.</p>
              <ul className="mb-8 space-y-3 text-gray-700">
                <li>🇪🇺 Réussir son appel à projet Européen</li>
                <li>📈 Go to market : vendre à ses premiers clients</li>
              </ul>
              <div className="mb-8">
                <p className="text-sm text-gray-500 font-semibold mb-4">Avec le soutien de :</p>
                <div className="flex justify-between items-center gap-6">
                  <img src="/logos/eit_logo.jpg" alt="EIT" className="h-10 object-contain" />
                  <img src="/logos/Flag_of_Europe.svg.webp" alt="UE" className="h-10 object-contain" />
                  <img src="/logos/Logo_Bpifrance.svg.png" alt="Bpifrance" className="h-10 object-contain" />
                </div>
              </div>
              <button onClick={nextStep} className="w-full bg-black text-white py-3 rounded-xl hover:opacity-90 transition">Je m'inscris</button>
            </motion.div>
          )}

          {/* STEP 2 - MODIFIÉ */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">👤 Vos informations</h2>
              <FormInput label="Nom" name="nom" value={formData.nom} onChange={handleChange} error={errors.nom} />
              <FormInput label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} error={errors.prenom} />
              <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
              <FormInput label="Téléphone" name="telephone" value={formData.telephone} onChange={handleChange} error={errors.telephone} />
              
              {/* ✅ Poste occupé (remplace Pays) */}
              <FormInput 
                label="Poste occupé" 
                name="poste" 
                value={formData.poste} 
                onChange={handleChange} 
                error={errors.poste}
              />
              
              {/* ✅ Nom de la startup (remplace Adresse) */}
              <FormInput 
                label="Nom de la startup" 
                name="startup" 
                value={formData.startup} 
                onChange={handleChange} 
                error={errors.startup}
              />

              <div className="flex justify-between pt-6">
                <button onClick={prevStep} className="text-gray-500 hover:text-black transition">Retour</button>
                <button onClick={nextStep} className="bg-black text-white px-6 py-2 rounded-xl hover:opacity-90 transition">Suivant</button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-semibold mb-6">🎓 Sélectionnez vos ateliers</h2>
              <div className="space-y-4 mb-6">
                {["🇪🇺 Réussir son appel à projet Européen", "📈 Go to market : vendre à ses premiers clients"].map(atelier => (
                  <label key={atelier} className="flex items-center gap-3 border p-4 rounded-xl hover:bg-gray-50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ateliers.includes(atelier)}
                      onChange={e => {
                        if (e.target.checked) setFormData(prev => ({ ...prev, ateliers: [...prev.ateliers, atelier] }));
                        else setFormData(prev => ({ ...prev, ateliers: prev.ateliers.filter(a => a !== atelier) }));
                      }}
                      className="w-5 h-5 accent-black"
                    />
                    <span className="text-gray-700">{atelier}</span>
                  </label>
                ))}
              </div>
              {errors.ateliers && <p className="text-red-500 text-sm mb-4">{errors.ateliers}</p>}
              {errors.form && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{errors.form}</p>}
              <div className="flex justify-between">
                <button onClick={prevStep} className="text-gray-500 hover:text-black transition" disabled={isSubmitting}>Retour</button>
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting || formData.ateliers.length === 0} 
                  className={`px-6 py-2 rounded-xl transition flex items-center gap-2 ${
                    isSubmitting || formData.ateliers.length === 0 
                      ? "bg-gray-300 cursor-not-allowed" 
                      : "bg-black text-white hover:opacity-90"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : "Valider ✓"}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4 - MODIFIÉ */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold mb-4">Merci pour votre inscription !</h2>
              <p className="text-gray-600 mb-6">Vous recevrez un email de confirmation sous peu.</p>
              <div className="bg-gray-50 rounded-xl p-6 text-left space-y-2">
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