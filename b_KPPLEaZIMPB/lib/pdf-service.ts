// lib/pdf-service.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface RapportData {
    titre: string;
    sousTitre: string;
    dateGeneration: string;
    periode?: string;
    statistiques: {
        totalApprovisionnements: number;
        totalFournisseurs: number;
        totalUnites: number;
        totalMontant: number;
    };
    approvisionnements: any[];
    filtreInfo?: string;
}

export const pdfService = {
    async genererRapportApprovisionnements(data: RapportData) {
        // Créer un nouveau document PDF
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Ajouter l'en-tête
        doc.setFillColor(16, 185, 129); // Couleur emerald
        doc.rect(0, 0, 297, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(data.titre, 14, 20);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(data.sousTitre, 14, 32);
        
        // Date de génération
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text(`Généré le: ${data.dateGeneration}`, 14, 48);
        
        if (data.periode) {
            doc.text(`Période: ${data.periode}`, 14, 56);
        }
        
        if (data.filtreInfo) {
            doc.setTextColor(59, 130, 246);
            doc.text(`Filtres: ${data.filtreInfo}`, 14, 64);
        }
        
        // Carte des statistiques
        let yStart = data.periode ? 72 : 64;
        if (data.filtreInfo) yStart += 8;
        
        // Fond pour les stats
        doc.setFillColor(245, 245, 245);
        doc.rect(14, yStart, 269, 35, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("STATISTIQUES", 14, yStart + 8);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        // Ligne 1
        doc.text(`Total Approvisionnements: ${data.statistiques.totalApprovisionnements}`, 14, yStart + 20);
        doc.text(`Fournisseurs distincts: ${data.statistiques.totalFournisseurs}`, 110, yStart + 20);
        doc.text(`Montant total: ${data.statistiques.totalMontant.toLocaleString()} $`, 200, yStart + 20);
        
        // Ligne 2
        doc.text(`Total unités commandées: ${data.statistiques.totalUnites.toLocaleString()}`, 14, yStart + 30);
        
        let yTable = yStart + 45;
        
        // Tableau des approvisionnements
        doc.setFillColor(16, 185, 129);
        doc.rect(14, yTable, 269, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("LISTE DES APPROVISIONNEMENTS", 14, yTable + 6);
        
        // Configuration du tableau
        const tableData = data.approvisionnements.map(approv => [
            `#${approv.id}`,
            new Date(approv.date_approv).toLocaleDateString('fr-FR'),
            approv.fournisseur?.nom || 'N/A',
            approv.admin?.nom || 'Admin',
            approv.detailapprovisionnements?.length || 0,
            `${approv.montant_total?.toLocaleString() || 0} $`,
            approv.detailapprovisionnements?.slice(0, 3).map(d => 
                `${d.produit?.nom}: ${d.quantite} (${d.prix_achat}$)`
            ).join(', ') || '-'
        ]);
        
        autoTable(doc, {
            startY: yTable + 12,
            head: [['ID', 'Date', 'Fournisseur', 'Traité par', 'Produits', 'Montant', 'Produits détaillés']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 3
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 35 },
                3: { cellWidth: 30 },
                4: { cellWidth: 20, halign: 'center' },
                5: { cellWidth: 30, halign: 'right' },
                6: { cellWidth: 65 }
            },
            margin: { left: 14, right: 14 },
            didDrawPage: (data) => {
                // Ajouter un pied de page
                const pageCount = doc.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Page ${data.pageNumber} sur ${pageCount}`,
                    doc.internal.pageSize.getWidth() - 20,
                    doc.internal.pageSize.getHeight() - 10
                );
                doc.text(
                    "Gestion de Stock - Rapport d'approvisionnement",
                    14,
                    doc.internal.pageSize.getHeight() - 10
                );
            }
        });
        
        // Nom du fichier
        const now = new Date();
        const fileName = `rapport_approvisionnements_${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}.pdf`;
        
        // Sauvegarder
        doc.save(fileName);
        
        return true;
    },
    
    async genererRapportProduits(produits: any[], statistiques: any) {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        // En-tête
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, 297, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("Rapport des Stocks", 14, 20);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text("Inventaire complet des produits", 14, 32);
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 48);
        
        // Statistiques
        doc.setFillColor(245, 245, 245);
        doc.rect(14, 58, 269, 35, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("STATISTIQUES DES STOCKS", 14, 66);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Total Produits: ${statistiques.totalProduits}`, 14, 78);
        doc.text(`Stock faible: ${statistiques.stockFaible}`, 110, 78);
        doc.text(`Valeur totale du stock: ${statistiques.valeurTotale.toLocaleString()} $`, 200, 78);
        doc.text(`Produits en rupture: ${statistiques.rupture}`, 14, 88);
        
        // Tableau des produits
        const tableData = produits.map(produit => [
            produit.nom,
            produit.categorie?.nom || '-',
            produit.stock_actuel || 0,
            produit.prix_vente_actuel?.toFixed(2) || 0,
            `$${((produit.stock_actuel || 0) * (produit.prix_vente_actuel || 0)).toLocaleString()}`
        ]);
        
        autoTable(doc, {
            startY: 102,
            head: [['Produit', 'Catégorie', 'Stock', 'Prix unitaire', 'Valeur totale']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 40 },
                2: { cellWidth: 30, halign: 'center' },
                3: { cellWidth: 35, halign: 'right' },
                4: { cellWidth: 40, halign: 'right' }
            }
        });
        
        const fileName = `rapport_stocks_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        return true;
    }
};