// types/jspdf-autotable.d.ts
declare module 'jspdf-autotable' {
    import { jsPDF } from 'jspdf';
    
    interface UserOptions {
        startY?: number;
        head?: any[][];
        body?: any[][];
        foot?: any[][];
        theme?: 'striped' | 'grid' | 'plain';
        styles?: any;
        headStyles?: any;
        bodyStyles?: any;
        footStyles?: any;
        alternateRowStyles?: any;
        columnStyles?: {
            [key: number]: {
                cellWidth?: number | 'auto' | 'wrap';
                minCellWidth?: number;
                halign?: 'left' | 'center' | 'right';
                valign?: 'middle' | 'top' | 'bottom';
                fillColor?: number[];
                textColor?: number[];
                fontStyle?: 'normal' | 'bold' | 'italic';
                lineWidth?: number;
            };
        };
        margin?: {
            top?: number;
            right?: number;
            bottom?: number;
            left?: number;
        };
        didDrawPage?: (data: any) => void;
        didParseCell?: (data: any) => void;
        willDrawCell?: (data: any) => void;
    }
    
    export default function autoTable(doc: jsPDF, options: UserOptions): void;
}