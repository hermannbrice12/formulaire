import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import emailjs from '@emailjs/browser';

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

    // ✅ 2. Envoi email via EmailJS
    try {
      const templateParams = {
        to_email: body.email,
        to_name: `${body.prenom} ${body.nom}`,
        prenom: body.prenom,
        nom: body.nom,
        email: body.email,
        poste: body.poste,
        startup: body.startup,
        ateliers: body.ateliers.join(', '),
        name: `${body.prenom} ${body.nom}`,
        title: 'Confirmation inscription',
      };

      // ✅ Variables d'environnement au lieu des valeurs en dur
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      console.log('📧 Email envoyé avec succès à:', body.email);
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