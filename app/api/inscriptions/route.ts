import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('📥 Requête reçue sur /api/inscriptions');
  
  try {
    const body = await request.json();
    console.log('📦 Données reçues:', body);
    
    // Insertion dans Supabase
    const { data, error } = await supabase
      .from('inscriptions')
      .insert([
        {
          nom: body.nom,
          prenom: body.prenom,
          email: body.email,
          telephone: body.telephone,
          pays: body.pays,
          adresse: body.adresse,
          ateliers: body.ateliers.join(', '),
          created_at: new Date().toISOString(),
        },
      ])
      .select(); // Retourne les données insérées

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return NextResponse.json(
        { 
          error: 'Erreur lors de la sauvegarde', 
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ Inscription créée avec succès:', data[0]);
    
    return NextResponse.json({ 
      success: true, 
      data: data[0] 
    });
    
  } catch (err: any) {
    console.error('💥 Erreur API:', err);
    return NextResponse.json(
      { 
        error: 'Erreur serveur', 
        details: err.message 
      },
      { status: 500 }
    );
  }
}