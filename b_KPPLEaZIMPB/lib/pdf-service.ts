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
    genererRapportApprovisionnements: async (data: RapportData) => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // En-tête - couleur bleue uniquement
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, 297, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(data.titre, 297/2, 25, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(data.sousTitre, 297/2, 35, { align: 'center' });
        
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(8);
        doc.text("Genere le: " + data.dateGeneration, 14, 42);
        
        let yPosition = 65;
        
        // Statistiques - fond gris clair
        doc.setFillColor(245, 245, 245);
        doc.rect(14, yPosition, 269, 35, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("STATISTIQUES", 14, yPosition + 8);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text("Total Approvisionnements: " + data.statistiques.totalApprovisionnements, 14, yPosition + 20);
        doc.text("Fournisseurs distincts: " + data.statistiques.totalFournisseurs, 110, yPosition + 20);
        doc.text("Total unites: " + data.statistiques.totalUnites, 210, yPosition + 20);
        
        const montantTotal = Math.round(data.statistiques.totalMontant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        doc.text("Montant total: " + montantTotal + " FCFA", 14, yPosition + 30);
        
        yPosition += 50;
        
        // Tableau
        const tableData = data.approvisionnements.map(approv => {
            const totalUnites = approv.detailapprovisionnements?.reduce((sum, d) => sum + (Number(d.quantite) || 0), 0) || 0;
            const montant = Math.round(approv.montant_total || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            
            let produitsText = '-';
            if (approv.detailapprovisionnements && approv.detailapprovisionnements.length > 0) {
                produitsText = approv.detailapprovisionnements.slice(0, 2).map(d => {
                    const nom = d.produit?.nom || "Produit";
                    return nom + ": " + d.quantite;
                }).join(", ");
                if (approv.detailapprovisionnements.length > 2) {
                    produitsText += " +" + (approv.detailapprovisionnements.length - 2) + " autres";
                }
            }
            
            const dateStr = new Date(approv.date_approv).toLocaleDateString('fr-FR');
            
            return [
                "#" + approv.id,
                dateStr,
                approv.fournisseur?.nom || 'N/A',
                approv.admin?.nom || 'Admin',
                totalUnites.toString(),
                montant + " FCFA",
                produitsText
            ];
        });
        
        const columnWidths = {
            0: 18,
            1: 28,
            2: 45,
            3: 35,
            4: 18,
            5: 45,
            6: 66
        };
        
        autoTable(doc, {
            startY: yPosition,
            head: [['ID', 'Date', 'Fournisseur', 'Agent', 'Qte', 'Montant', 'Produits']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                fontSize: 9,
                cellPadding: 3,
                lineWidth: 0.5,
                lineColor: [0, 0, 0]
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 2,
                valign: 'middle',
                lineWidth: 0.3,
                lineColor: [200, 200, 200]
            },
            alternateRowStyles: {
                fillColor: [248, 248, 248]
            },
            columnStyles: {
                0: { cellWidth: columnWidths[0], halign: 'center', valign: 'middle' },
                1: { cellWidth: columnWidths[1], halign: 'center', valign: 'middle' },
                2: { cellWidth: columnWidths[2], halign: 'left', valign: 'middle' },
                3: { cellWidth: columnWidths[3], halign: 'left', valign: 'middle' },
                4: { cellWidth: columnWidths[4], halign: 'center', valign: 'middle' },
                5: { cellWidth: columnWidths[5], halign: 'right', valign: 'middle' },
                6: { cellWidth: columnWidths[6], halign: 'left', valign: 'middle' }
            },
            margin: { left: 14, right: 14 },
            tableWidth: 'auto',
            horizontalPageBreak: false
        });
        
        // Pied de page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(128, 128, 128);
            doc.text(
                "Page " + i + " sur " + pageCount,
                doc.internal.pageSize.getWidth() - 20,
                doc.internal.pageSize.getHeight() - 10
            );
            doc.text(
                "Rapport d'Approvisionnement - Gestion de Stock",
                14,
                doc.internal.pageSize.getHeight() - 10
            );
        }
        
        const fileName = "rapport_approvisionnements_" + new Date().toISOString().split('T')[0] + ".pdf";
        doc.save(fileName);
        
        return true;
    },
    
    genererRapportProduits: async (produits: any[], statistiques: any) => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        // En-tête - couleur bleue uniquement
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, 297, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text("Rapport des Stocks", 297/2, 25, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text("Inventaire complet des produits", 297/2, 35, { align: 'center' });
        
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(8);
        doc.text("Genere le: " + new Date().toLocaleString('fr-FR'), 14, 42);
        
        // Statistiques - fond gris clair
        doc.setFillColor(245, 245, 245);
        doc.rect(14, 65, 269, 40, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("STATISTIQUES DES STOCKS", 14, 73);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text("Total Produits: " + statistiques.totalProduits, 14, 88);
        doc.text("Stock faible: " + statistiques.stockFaible, 110, 88);
        doc.text("En rupture: " + statistiques.rupture, 210, 88);
        
        const valeurTotale = Math.round(statistiques.valeurTotale).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        doc.text("Valeur totale du stock: " + valeurTotale + " FCFA", 14, 100);
        
        const tableData = produits.map(produit => {
            const stock = produit.stock_actuel || 0;
            const prix = produit.prix_vente_actuel || 0;
            const valeur = stock * prix;
            
            return [
                produit.nom,
                produit.categorie?.nom || '-',
                stock.toString(),
                Math.round(prix).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA",
                Math.round(valeur).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA"
            ];
        });
        
        const columnWidths = {
            0: 60,
            1: 40,
            2: 25,
            3: 50,
            4: 50
        };
        
        autoTable(doc, {
            startY: 120,
            head: [['Produit', 'Categorie', 'Stock', 'Prix unitaire', 'Valeur totale']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                fontSize: 9,
                cellPadding: 3
            },
            bodyStyles: {
                fontSize: 8,
                valign: 'middle',
                cellPadding: 2
            },
            alternateRowStyles: {
                fillColor: [248, 248, 248]
            },
            columnStyles: {
                0: { cellWidth: columnWidths[0], halign: 'left', valign: 'middle' },
                1: { cellWidth: columnWidths[1], halign: 'left', valign: 'middle' },
                2: { cellWidth: columnWidths[2], halign: 'center', valign: 'middle' },
                3: { cellWidth: columnWidths[3], halign: 'right', valign: 'middle' },
                4: { cellWidth: columnWidths[4], halign: 'right', valign: 'middle' }
            },
            margin: { left: 14, right: 14 }
        });
        
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(128, 128, 128);
            doc.text(
                "Page " + i + " sur " + pageCount,
                doc.internal.pageSize.getWidth() - 20,
                doc.internal.pageSize.getHeight() - 10
            );
            doc.text(
                "Rapport des Stocks - Gestion de Stock",
                14,
                doc.internal.pageSize.getHeight() - 10
            );
        }
        
        const fileName = "rapport_stocks_" + new Date().toISOString().split('T')[0] + ".pdf";
        doc.save(fileName);
        
        return true;
    },

    // Rapport pour un seul approvisionnement
    genererRapportApprovisionnementUnique: async (data: any) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // En-tête - couleur bleue uniquement
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, 210, 50, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(data.titre, 210/2, 28, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(data.sousTitre, 210/2, 38, { align: 'center' });
        
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(8);
        doc.text("Genere le: " + data.dateGeneration, 14, 48);
        
        // Informations de l'approvisionnement
        let yPosition = 70;
        const approv = data.approvisionnement;
        
        // Cadre informations - gris clair
        doc.setFillColor(240, 240, 240);
        doc.rect(14, yPosition, 182, 35, 'F');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("INFORMATIONS GENERALES", 14, yPosition + 8);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text("N°: " + approv.id, 14, yPosition + 20);
        doc.text("Date: " + new Date(approv.date_approv).toLocaleDateString('fr-FR'), 14, yPosition + 28);
        doc.text("Fournisseur: " + (approv.fournisseur?.nom || "N/A"), 100, yPosition + 20);
        doc.text("Traite par: " + (approv.admin?.nom || "Admin"), 100, yPosition + 28);
        
        yPosition += 50;
        
        // Statistiques - gris clair
        doc.setFillColor(245, 245, 245);
        doc.rect(14, yPosition, 182, 30, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("RESUME", 14, yPosition + 8);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text("Nombre de produits: " + data.statistiques.totalProduits, 14, yPosition + 20);
        doc.text("Total unites: " + data.statistiques.totalUnites, 14, yPosition + 28);
        doc.text("Montant total: " + Math.round(data.statistiques.montantTotal).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA", 100, yPosition + 28);
        
        // Liste des produits
        yPosition += 55;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("DETAIL DES PRODUITS", 14, yPosition);
        
        yPosition += 8;
        
        const details = approv.detailapprovisionnements || [];
        
        const tableData = details.map((detail: any, index: number) => {
            const quantite = Number(detail.quantite) || 0;
            const prixAchat = typeof detail.prix_achat === 'string' ? parseFloat(detail.prix_achat) : (Number(detail.prix_achat) || 0);
            const total = quantite * prixAchat;
            
            const prixFormatted = Math.round(prixAchat).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            const totalFormatted = Math.round(total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            
            return [
                (index + 1).toString(),
                detail.produit?.nom || "Produit",
                quantite.toString(),
                prixFormatted + " FCFA",
                totalFormatted + " FCFA"
            ];
        });
        
        const columnWidths = {
            0: 15,
            1: 75,
            2: 30,
            3: 45,
            4: 45
        };
        
        autoTable(doc, {
            startY: yPosition,
            head: [['#', 'Produit', 'Quantite', 'Prix unitaire', 'Total']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                fontSize: 9,
                cellPadding: 3
            },
            bodyStyles: {
                fontSize: 8,
                valign: 'middle',
                cellPadding: 2
            },
            alternateRowStyles: {
                fillColor: [248, 248, 248]
            },
            columnStyles: {
                0: { cellWidth: columnWidths[0], halign: 'center', valign: 'middle' },
                1: { cellWidth: columnWidths[1], halign: 'left', valign: 'middle' },
                2: { cellWidth: columnWidths[2], halign: 'center', valign: 'middle' },
                3: { cellWidth: columnWidths[3], halign: 'right', valign: 'middle' },
                4: { cellWidth: columnWidths[4], halign: 'right', valign: 'middle' }
            },
            margin: { left: 14, right: 14 }
        });
        
        // Pied de page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(128, 128, 128);
            doc.text(
                "Page " + i + " sur " + pageCount,
                doc.internal.pageSize.getWidth() - 20,
                doc.internal.pageSize.getHeight() - 10
            );
            doc.text(
                "Bon d'Approvisionnement - Gestion de Stock",
                14,
                doc.internal.pageSize.getHeight() - 10
            );
        }
        
        const fileName = "approvisionnement_" + approv.id + "_" + new Date().toISOString().split('T')[0] + ".pdf";
        doc.save(fileName);
        
        return true;
    }
};