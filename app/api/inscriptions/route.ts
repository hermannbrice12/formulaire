import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  console.log('📥 Requête reçue sur /api/inscriptions');

  try {
    const body = await request.json();
    console.log('📦 Données reçues:', body);

    // ✅ 1. Sauvegarde Supabase
    const { data, error } = await supabase
      .from('inscriptions')
      .insert([
        {
          nom: body.nom,
          prenom: body.prenom,
          email: body.email,
          telephone: body.telephone,
          poste: body.poste,
          startup: body.startup,
          ateliers: body.ateliers.join(', '),
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return NextResponse.json(
        {
          error: 'Erreur lors de la sauvegarde',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Inscription créée avec succès:', data[0]);

    // ✅ 2. Envoi email automatique
    try {
      await resend.emails.send({
        from: "Ateliers Startups <onboarding@resend.dev>", // ⚠️ à changer en prod
        to: body.email,
        subject: "🎉 Confirmation de votre inscription",
        html: `
          <div style="font-family: Arial, sans-serif; line-height:1.6;">
            <h2>Bonjour ${body.prenom} 👋</h2>

            <p>Merci pour votre inscription aux <strong>ateliers startups</strong> 🚀</p>

            <h3>📋 Récapitulatif :</h3>
            <ul>
              <li><strong>Nom :</strong> ${body.prenom} ${body.nom}</li>
              <li><strong>Email :</strong> ${body.email}</li>
              <li><strong>Startup :</strong> ${body.startup}</li>
              <li><strong>Ateliers :</strong> ${body.ateliers.join(', ')}</li>
            </ul>

            <p>Nous vous recontacterons très prochainement.</p>

            <br/>
            <p>— L'équipe Ateliers Startups</p>
          </div>
        `,
      });

      console.log('📧 Email envoyé avec succès');
    } catch (mailError) {
      console.error('⚠️ Erreur envoi email (non bloquante):', mailError);
    }

    return NextResponse.json({
      success: true,
      data: data[0],
    });

  } catch (err: any) {
    console.error('💥 Erreur API:', err);

    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: err.message,
      },
      { status: 500 }
    );
  }
}