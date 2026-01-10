import { Component, OnInit, ChangeDetectionStrategy, signal, inject, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account/account.service';
import { WarmupCalculatorComponent } from '../warmup-calculator/warmup-calculator.component';
import { PlateColorSettingsComponent } from '../plate-color-settings/plate-color-settings.component';
import { InputDialogComponent } from '../../input-dialog/input-dialog.component';

@Component({
  selector: 'app-plate-calculator',
  templateUrl: './plate-calculator.component.html',
  styleUrls: ['./plate-calculator.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    TranslateModule,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlateCalculatorComponent implements OnInit {
    private dialogRef = inject(MatDialogRef<PlateCalculatorComponent>);
    private dialog = inject(MatDialog);
    private accountService = inject(AccountService);
    public translate = inject(TranslateService);

    fields = signal<any>({
        units: ["kg", "lbs"],
        lbsPlates: [110,65,55,45,35,25,15,10,5,2.5,1.25,0.5],
        kgPlates: [50,30,25,20,15,10,5,2.5,1.25,0.5,0.25],
        defaultLbsPlates: [45,35,25,10,5,2.5],
        defaultKgPlates: [20,15,10,5,2.5,1.25],
        lbsBarWeights: [25,35,45,55],
        kgBarWeights: [10,15,20,25],
        defaultLbsBarWeight: 45,
        defaultKgBarWeight: 20,
        defaultLbsCollarWeight: 0,
        defaultKgCollarWeight: 0
    });

    selectedValues = signal<any>({
        weight: null,
        units: null,
        lbsPlates: [],
        kgPlates: [],
        platesString: "",
        lbsBarWeight: 45,
        kgBarWeight: 20,
        lbsCollarWeight: 0,
        kgCollarWeight: 0
    });

    user = signal<any>({});
    showBack = signal<boolean>(false);
    showWarmup = signal<boolean>(false);
    set = signal<any>(null);

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { set?: any }
    ) {
        if (data?.set) {
            this.set.set(data.set);
            this.selectedValues.update(v => ({
                ...v,
                weight: parseFloat(data.set.weight),
                units: data.set.unit
            }));
        }
    }

    async ngOnInit(): Promise<void> {
        const savedFields = await this.accountService.getWeightCalculatorProps();
        if (savedFields) {
            const parsed = JSON.parse(savedFields);
            this.fields.set(parsed);
            
            this.selectedValues.update(v => ({
                ...v,
                lbsBarWeight: parsed.defaultLbsBarWeight,
                kgBarWeight: parsed.defaultKgBarWeight,
                lbsCollarWeight: parsed.defaultLbsCollarWeight,
                kgCollarWeight: parsed.defaultKgCollarWeight
            }));

            this.calculatePlates();
        }

        await this.initPlateColors();

        this.accountService.getAccountObservable().subscribe((user: any) => {
            if (user && user.id) {
                this.user.set(user);

                if (!this.selectedValues().units) {
                    this.selectedValues.update(v => ({
                        ...v,
                        units: user.units
                    }));
                }

                this.calculatePlates();
            }
        });

        // Calculate plates if data was provided in constructor
        if (this.data?.set) {
            this.calculatePlates();
        }
    }

    cancel(): void {
        this.dialogRef.close();
    }

    openWarmupCalculator(): void {
        this.dialog.open(WarmupCalculatorComponent, {
            width: '800px',
            maxWidth: '95vw',
            data: { 
                user: this.user(), 
                set: this.set()
            }
        });
    }

    openColorSettings(): void {
        const dialogRef = this.dialog.open(PlateColorSettingsComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: { units: this.selectedValues().units }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.colors) {
                this.calculatePlates();
            }
        });
    }

    togglePlateOption(plateOption: number): void {
        const currentFields = this.fields();
        const currentUnits = this.selectedValues().units;

        if (currentUnits === 'lbs') {
            const existingIndex = currentFields.defaultLbsPlates.indexOf(plateOption);
            if (existingIndex < 0) {
                currentFields.defaultLbsPlates.push(plateOption);
            } else {
                currentFields.defaultLbsPlates.splice(existingIndex, 1);
            }
        } else {
            const existingIndex = currentFields.defaultKgPlates.indexOf(plateOption);
            if (existingIndex < 0) {
                currentFields.defaultKgPlates.push(plateOption);
            } else {
                currentFields.defaultKgPlates.splice(existingIndex, 1);
            }
        }

        this.fields.set({ ...currentFields });
        this.calculatePlates();
        this.accountService.setWeightCalculatorProps(currentFields);
    }

    selectBarWeight(barWeight: number): void {
        const currentFields = this.fields();
        const currentValues = this.selectedValues();

        if (currentValues.units === 'lbs') {
            this.selectedValues.update(v => ({ ...v, lbsBarWeight: barWeight }));
            currentFields.defaultLbsBarWeight = barWeight;
        } else {
            this.selectedValues.update(v => ({ ...v, kgBarWeight: barWeight }));
            currentFields.defaultKgBarWeight = barWeight;
        }

        this.fields.set(currentFields);
        this.calculatePlates();
        this.accountService.setWeightCalculatorProps(currentFields);
    }

    openAddCustomBarWeight(): void {
        const dialogRef = this.dialog.open(InputDialogComponent, {
            width: '400px',
            maxWidth: '95vw',
            data: {
                title: this.translate.instant('Add Custom Bar Weight'),
                message: this.translate.instant('Enter your custom bar weight below'),
                defaultValue: '',
                inputType: 'number',
                placeholder: this.translate.instant('Bar Weight')
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.value) {
                const weight = parseFloat(result.value);
                const currentFields = this.fields();
                const currentValues = this.selectedValues();

                if (currentValues.units === "lbs") {
                    if (currentFields.lbsBarWeights.indexOf(weight) < 0) {
                        currentFields.lbsBarWeights.push(weight);
                        currentFields.lbsBarWeights.sort((a: number, b: number) => a - b);
                    }
                    currentFields.defaultLbsBarWeight = weight;
                    this.selectedValues.update(v => ({ ...v, lbsBarWeight: weight }));
                } else {
                    if (currentFields.kgBarWeights.indexOf(weight) < 0) {
                        currentFields.kgBarWeights.push(weight);
                        currentFields.kgBarWeights.sort((a: number, b: number) => a - b);
                    }
                    currentFields.defaultKgBarWeight = weight;
                    this.selectedValues.update(v => ({ ...v, kgBarWeight: weight }));
                }

                this.fields.set(currentFields);
                this.calculatePlates();
                this.accountService.setWeightCalculatorProps(currentFields);
            }
        });
    }

    openAddCustomPlate(): void {
        const dialogRef = this.dialog.open(InputDialogComponent, {
            width: '400px',
            maxWidth: '95vw',
            data: {
                title: this.translate.instant('Add Custom Plate Weight'),
                message: this.translate.instant('Enter your custom plate weight below'),
                defaultValue: '',
                inputType: 'number',
                placeholder: this.translate.instant('Plate Weight')
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.value) {
                const weight = parseFloat(result.value);
                const currentFields = this.fields();
                const currentValues = this.selectedValues();

            if (currentValues.units === "lbs") {
                if (currentFields.lbsPlates.indexOf(weight) < 0) {
                    currentFields.lbsPlates.push(weight);
                    currentFields.lbsPlates.sort((a: number, b: number) => b - a);
                }
                if (currentFields.defaultLbsPlates.indexOf(weight) < 0) {
                    currentFields.defaultLbsPlates.push(weight);
                    currentFields.defaultLbsPlates.sort((a: number, b: number) => b - a);
                }
            } else {
                if (currentFields.kgPlates.indexOf(weight) < 0) {
                    currentFields.kgPlates.push(weight);
                    currentFields.kgPlates.sort((a: number, b: number) => b - a);
                }
                if (currentFields.defaultKgPlates.indexOf(weight) < 0) {
                    currentFields.defaultKgPlates.push(weight);
                    currentFields.defaultKgPlates.sort((a: number, b: number) => b - a);
                }
            }

                this.fields.set(currentFields);
                this.calculatePlates();
                this.accountService.setWeightCalculatorProps(currentFields);
            }
        });
    }

    calculatePlates(): string {
        const currentValues = this.selectedValues();
        
        if (!currentValues.weight || !currentValues.units) {
            return '';
        }

        const currentFields = this.fields();
        const barweight = currentValues.units === "lbs" ? currentValues.lbsBarWeight : currentValues.kgBarWeight;
        let plates = currentValues.units === "lbs" ? [...currentFields.defaultLbsPlates] : [...currentFields.defaultKgPlates];
        const collarWeight = currentValues.units === "lbs" ? currentValues.lbsCollarWeight : currentValues.kgCollarWeight;

        plates.sort((a: number, b: number) => b - a);

        let weightExcludingBar = currentValues.weight - barweight - (collarWeight * 2);
        let weightOneSide = weightExcludingBar / 2;

        let i = 0;
        const platecount = plates.map(() => 0);
        
        while (i < plates.length) {
            while (plates[i] <= weightOneSide) {
                weightOneSide -= plates[i];
                platecount[i]++;
            }
            i++;
        }
        
        let returnString = "";
        const platesPerSide: number[] = [];

        for (let index = 0; index < platecount.length; index++) {
            if (platecount[index] > 0) {
                const count = platecount[index];
                returnString = returnString + count + "x" + plates[index] + currentValues.units + ", ";
                for (let j = 0; j < count; j++) {
                    platesPerSide.push(plates[index]);
                }
            }
        }
        
        returnString = returnString.replace(/(^[,\s]+)|([,\s]+$)/g, '');

        this.selectedValues.update(v => ({
            ...v,
            platesString: returnString,
            lbsPlates: currentValues.units === "lbs" ? platesPerSide : v.lbsPlates,
            kgPlates: currentValues.units === "kg" ? platesPerSide : v.kgPlates
        }));

        return returnString;
    }

    cssPlateName(plate: number): string {
        const currentUnits = this.selectedValues().units;
        const largerCutOff = currentUnits === "lbs" ? 55 : 25;
        const smallerCutOff = currentUnits === "lbs" ? 2.5 : 1.25;
        
        if (plate > largerCutOff) {
            return "larger";
        } else if (plate < smallerCutOff) {
            return "smaller";
        }
        return ("" + plate).replace(".", "point") + currentUnits;
    }

    get collarWeight(): number {
        const currentValues = this.selectedValues();
        return currentValues.units === 'lbs' ? currentValues.lbsCollarWeight : currentValues.kgCollarWeight;
    }

    set collarWeight(value: number) {
        const currentFields = this.fields();
        const currentValues = this.selectedValues();
        
        if (currentValues.units === 'lbs') {
            this.selectedValues.update(v => ({ ...v, lbsCollarWeight: value }));
            currentFields.defaultLbsCollarWeight = value;
        } else {
            this.selectedValues.update(v => ({ ...v, kgCollarWeight: value }));
            currentFields.defaultKgCollarWeight = value;
        }
        
        this.fields.set(currentFields);
        this.calculatePlates();
        this.accountService.setWeightCalculatorProps(currentFields);
    }

    private async initPlateColors(): Promise<void> {
        const savedColors = await this.accountService.getPlateColors();
        if (savedColors) {
            const colors = JSON.parse(savedColors);
            const root = document.documentElement;
            
            Object.keys(colors).forEach(plateId => {
                if (colors[plateId].color) {
                    root.style.setProperty(`--plate-color-${plateId}`, colors[plateId].color);
                }
                if (colors[plateId].textColor) {
                    root.style.setProperty(`--plate-text-color-${plateId}`, colors[plateId].textColor);
                }
            });
        }
    }

    updateWeight(value: string): void {
        this.selectedValues.update(v => ({
            ...v,
            weight: value ? parseFloat(value) : null
        }));
        this.calculatePlates();
    }

    updateUnits(value: string): void {
        this.selectedValues.update(v => ({
            ...v,
            units: value
        }));
        this.calculatePlates();
    }

    updateCollarWeight(value: string): void {
        this.collarWeight = value ? parseFloat(value) : 0;
    }

    get currentBarWeight(): number {
        const currentValues = this.selectedValues();
        return currentValues.units === "lbs" ? currentValues.lbsBarWeight : currentValues.kgBarWeight;
    }

    get currentPlates(): number[] {
        const currentFields = this.fields();
        const currentValues = this.selectedValues();
        return currentValues.units === "lbs" ? currentFields.lbsPlates : currentFields.kgPlates;
    }

    get currentDefaultPlates(): number[] {
        const currentFields = this.fields();
        const currentValues = this.selectedValues();
        return currentValues.units === "lbs" ? currentFields.defaultLbsPlates : currentFields.defaultKgPlates;
    }

    get currentBarWeights(): number[] {
        const currentFields = this.fields();
        const currentValues = this.selectedValues();
        return currentValues.units === "lbs" ? currentFields.lbsBarWeights : currentFields.kgBarWeights;
    }

    get displayedPlates(): number[] {
        const currentValues = this.selectedValues();
        return currentValues.units === "lbs" ? currentValues.lbsPlates : currentValues.kgPlates;
    }
}
