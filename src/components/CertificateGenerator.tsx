/**
 * Composant pour générer des certificats PDF pour les gagnants de concours
 * Utilise jsPDF pour créer des certificats professionnels téléchargeables
 */

import { Award, Trophy, Medal, Star } from "lucide-react";

export interface CertificateData {
  contestName: string;
  contestDate: string;
  entryName: string;
  producerName: string;
  producerOrganization?: string;
  rank: number;
  combinedScore: number;
  judgeAverage: number;
  publicAverage: number;
  badges?: Array<{
    badge: string;
    label: string;
  }>;
}

/**
 * Génère un certificat PDF pour un gagnant de concours
 */
export async function generateWinnerCertificate(data: CertificateData): Promise<void> {
  // Lazy load jsPDF uniquement quand nécessaire
  const [{ default: jsPDF }] = await Promise.all([
    import("jspdf")
  ]);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Couleurs CBD Flower Cup
  const primaryColor = [16, 185, 129]; // Vert #10b981
  const secondaryColor = [34, 197, 94]; // Vert plus clair
  const accentColor = [251, 191, 36]; // Or pour les médailles
  const textColor = [15, 23, 42]; // Slate-900
  const mutedColor = [71, 85, 105]; // Slate-600

  // Fond avec dégradé (simulé avec des rectangles)
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Bordure décorative
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Ligne décorative interne
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // En-tête - Logo/Titre
  doc.setFillColor(...primaryColor);
  doc.rect(20, 20, pageWidth - 40, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("CBD Flower Cup", pageWidth / 2, 35, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Certificat de Récompense", pageWidth / 2, 42, { align: "center" });

  // Corps du certificat
  doc.setTextColor(...textColor);
  
  // Titre principal
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICAT", pageWidth / 2, 70, { align: "center" });

  // Texte d'attribution
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Ce certificat atteste que", pageWidth / 2, 85, { align: "center" });

  // Nom du produit (en grand)
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  const entryNameY = 100;
  doc.text(`"${data.entryName}"`, pageWidth / 2, entryNameY, { align: "center", maxWidth: pageWidth - 60 });

  // Producteur
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  const producerText = data.producerOrganization 
    ? `${data.producerName} (${data.producerOrganization})`
    : data.producerName;
  doc.text(producerText, pageWidth / 2, entryNameY + 15, { align: "center", maxWidth: pageWidth - 60 });

  // Résultats
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("a obtenu", pageWidth / 2, entryNameY + 30, { align: "center" });

  // Position/Rang avec médaille
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...accentColor);
  
  const rankText = data.rank === 1 ? "1er PLACE" : data.rank === 2 ? "2ème PLACE" : data.rank === 3 ? "3ème PLACE" : `${data.rank}ème PLACE`;
  doc.text(rankText, pageWidth / 2, entryNameY + 45, { align: "center" });

  // Concours
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text(`au concours "${data.contestName}"`, pageWidth / 2, entryNameY + 55, { align: "center", maxWidth: pageWidth - 60 });

  // Date
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text(`Date : ${data.contestDate}`, pageWidth / 2, entryNameY + 63, { align: "center" });

  // Section Scores
  const scoresY = entryNameY + 75;
  doc.setFillColor(255, 255, 255);
  doc.rect(30, scoresY, pageWidth - 60, 35, "F");
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.rect(30, scoresY, pageWidth - 60, 35);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text("Scores obtenus", pageWidth / 2, scoresY + 8, { align: "center" });

  // Détails des scores
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Score Combiné : ${data.combinedScore.toFixed(1)}/100`, 45, scoresY + 18);
  doc.text(`Moyenne Jury : ${data.judgeAverage.toFixed(1)}/100`, 45, scoresY + 25);
  doc.text(`Moyenne Public : ${data.publicAverage.toFixed(1)}/5`, pageWidth - 45, scoresY + 18);
  
  if (data.badges && data.badges.length > 0) {
    const badgesText = data.badges.map(b => b.label).join(", ");
    doc.text(`Badges : ${badgesText}`, pageWidth - 45, scoresY + 25, { maxWidth: pageWidth / 2 - 50 });
  }

  // Ligne de signature
  const signatureY = pageHeight - 50;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedColor);
  doc.text("Ce certificat est généré automatiquement par la plateforme CBD Flower Cup", pageWidth / 2, signatureY, { align: "center" });
  
  doc.text("Il atteste la participation et le classement dans le concours mentionné ci-dessus.", pageWidth / 2, signatureY + 8, { align: "center" });

  // Footer
  doc.setFontSize(8);
  doc.text("www.cbdflowercup.com", pageWidth / 2, pageHeight - 15, { align: "center" });

  // Télécharger le PDF
  const fileName = `Certificat_${data.entryName.replace(/[^a-z0-9]/gi, "_")}_${data.contestName.replace(/[^a-z0-9]/gi, "_")}_${data.rank}.pdf`;
  doc.save(fileName);
}

