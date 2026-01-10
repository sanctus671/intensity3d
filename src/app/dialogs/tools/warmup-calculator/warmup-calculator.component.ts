import { Component, OnInit, ChangeDetectionStrategy, signal, inject, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account/account.service';
import { PlateColorSettingsComponent } from '../plate-color-settings/plate-color-settings.component';
import { InputDialogComponent } from '../../input-dialog/input-dialog.component';

@Component({
  selector: 'app-warmup-calculator',
  templateUrl: './warmup-calculator.component.html',
  styleUrls: ['./warmup-calculator.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    TranslateModule,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarmupCalculatorComponent implements OnInit {
    private dialogRef = inject(MatDialogRef<WarmupCalculatorComponent>);
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
        defaultKgCollarWeight: 0,
        warmupCustomSets: [{reps:10, weight:"bar", percentage:""}],
        warmupMethod: 'startingstrength'
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
    calculatedWarmupSets = signal<Array<any>>([]);
    set = signal<any>(null);

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { set?: any, user?: any }
    ) {
        if (data?.set) {
            this.set.set(data.set);
            this.selectedValues.update(v => ({
                ...v,
                weight: parseFloat(data.set.weight),
                units: data.set.unit
            }));
        }

        if (data?.user) {
            this.user.set(data.user);
        }

        this.calculateWarmups();
    }

    async ngOnInit(): Promise<void> {
        const savedFields = await this.accountService.getWeightCalculatorProps();
        if (savedFields) {
            let parsed = JSON.parse(savedFields);

            if (!parsed.warmupMethod) {
                parsed.warmupCustomSets = [{reps:10, weight:"bar", percentage:""}];
                parsed.warmupMethod = 'startingstrength';
            }

            this.fields.set(parsed);
            
            this.selectedValues.update(v => ({
                ...v,
                lbsBarWeight: parsed.defaultLbsBarWeight,
                kgBarWeight: parsed.defaultKgBarWeight,
                lbsCollarWeight: parsed.defaultLbsCollarWeight,
                kgCollarWeight: parsed.defaultKgCollarWeight
            }));

            this.calculateWarmups();
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

                this.calculateWarmups();
            }
        });
    }

    cancel(): void {
        this.dialogRef.close();
    }

    openWarmupPlates(set: any): void {
        alert(
            `${set.reps} ${this.translate.instant('reps at')} ${set.weight}${this.selectedValues().units}${set.percentage ? ` (${set.percentage}% ${this.translate.instant('of work weight')})` : ''}\n\n${set.plates}`
        );
    }

    openColorSettings(): void {
        const dialogRef = this.dialog.open(PlateColorSettingsComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: { units: this.selectedValues().units }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result?.colors) {
                this.calculateWarmups();
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
        this.calculateWarmups();
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
        this.calculateWarmups();
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
                this.calculateWarmups();
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
                this.calculateWarmups();
                this.accountService.setWeightCalculatorProps(currentFields);
            }
        });
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

    savewarmupMethod(): void {
        this.calculateWarmups();
        this.accountService.setWeightCalculatorProps(this.fields());
    }

    saveWarmupCustomSets(): void {
        this.calculateWarmups();
        this.accountService.setWeightCalculatorProps(this.fields());
    }

    addWarmupSet(): void {
        const currentFields = this.fields();
        currentFields.warmupCustomSets.push({reps:"", weight:"", percentage:""});
        this.fields.set({ ...currentFields });
        this.saveWarmupCustomSets();
    }

    removeWarmupSet(index: number): void {
        const currentFields = this.fields();
        currentFields.warmupCustomSets.splice(index, 1);
        this.fields.set({ ...currentFields });
        this.saveWarmupCustomSets();
    }

    calculateWarmups(): Array<any> {
        const currentValues = this.selectedValues();
        const currentFields = this.fields();
        
        if (!currentValues.weight || !currentValues.units) {
            this.calculatedWarmupSets.set([]);
            return [];
        }

        let warmupSets: any[] = [];
        if (currentFields.warmupMethod === "startingstrength") {
            warmupSets = [
                {reps:5, weight:"bar", percentage:""},
                {reps:5, weight:"bar", percentage:""},
                {reps:5, weight:"workweight", percentage:40},
                {reps:3, weight:"workweight", percentage:60},
                {reps:2, weight:"workweight", percentage:80},
            ];
        } else if (currentFields.warmupMethod === "507085") {
            warmupSets = [
                {reps:5, weight:"bar", percentage:""},
                {reps:5, weight:"bar", percentage:""},
                {reps:5, weight:"workweight", percentage:50},
                {reps:3, weight:"workweight", percentage:70},
                {reps:2, weight:"workweight", percentage:85},
            ];
        } else if (currentFields.warmupMethod === "custom") {
            warmupSets = currentFields.warmupCustomSets;
        }
        
        const calculatedSets = warmupSets.map((set: any) => {
            const calculatedSet: any = {reps:set.reps, weight:0, percentage:set.percentage, plates:""};
            if (set.weight === "bar") {
                const barweight = currentValues.units === "lbs" ? currentValues.lbsBarWeight : currentValues.kgBarWeight;
                calculatedSet.weight = barweight;
                calculatedSet.plates = this.translate.instant("Just the bar");
            } else {
                const result = this.calculateWarmupWeight(currentValues.weight * (set.percentage / 100));
                calculatedSet.weight = parseFloat(result.weight);
                calculatedSet.plates = result.plates;
            }
            return calculatedSet;
        });

        this.calculatedWarmupSets.set(calculatedSets);
        return calculatedSets;
    }

    private calculateWarmupWeight(totalWeight: number): any {
        const currentValues = this.selectedValues();
        const currentFields = this.fields();
        
        if (!totalWeight || !currentValues.units) {
            return {weight: null, plates: null};
        }

        const barweight = currentValues.units === "lbs" ? currentValues.lbsBarWeight : currentValues.kgBarWeight;
        let plates = currentValues.units === "lbs" ? [...currentFields.defaultLbsPlates] : [...currentFields.defaultKgPlates];
        const collarWeight = currentValues.units === "lbs" ? currentValues.lbsCollarWeight : currentValues.kgCollarWeight;

        plates.sort((a: number, b: number) => b - a);

        let weight = (totalWeight - barweight - (collarWeight * 2)) / 2;
        let roundedWeight = 0;

        let i = 0;
        const platecount = plates.map(() => 0);
        
        while (i < plates.length) {
            while (plates[i] <= weight) {
                weight -= plates[i];
                platecount[i]++;
            }
            i++;
        }
        
        let returnString = "";
        for (let index = 0; index < platecount.length; index++) {
            if (platecount[index] > 0) {
                const count = platecount[index];
                returnString = returnString + count + "x" + plates[index] + currentValues.units + ", ";
                roundedWeight = roundedWeight + (count * plates[index]);
            }
        }
        
        returnString = returnString.replace(/(^[,\s]+)|([,\s]+$)/g, '');
        roundedWeight = (roundedWeight * 2) + parseFloat(barweight.toString());
        
        return {weight: roundedWeight, plates: returnString};
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
        this.calculateWarmups();
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
        this.calculateWarmups();
    }

    updateUnits(value: string): void {
        this.selectedValues.update(v => ({
            ...v,
            units: value
        }));
        this.calculateWarmups();
    }

    updateCollarWeight(value: string): void {
        this.collarWeight = value ? parseFloat(value) : 0;
    }

    updateWarmupMethod(value: string): void {
        const currentFields = this.fields();
        currentFields.warmupMethod = value;
        this.fields.set({ ...currentFields });
        this.savewarmupMethod();
    }

    updateCustomSetReps(index: number, value: any): void {
        const currentFields = this.fields();
        currentFields.warmupCustomSets[index].reps = value;
        this.fields.set({ ...currentFields });
        this.saveWarmupCustomSets();
    }

    updateCustomSetWeight(index: number, value: string): void {
        const currentFields = this.fields();
        currentFields.warmupCustomSets[index].weight = value;
        this.fields.set({ ...currentFields });
        this.saveWarmupCustomSets();
    }

    updateCustomSetPercentage(index: number, value: any): void {
        const currentFields = this.fields();
        currentFields.warmupCustomSets[index].percentage = value;
        this.fields.set({ ...currentFields });
        this.saveWarmupCustomSets();
    }

    get currentBarWeights(): number[] {
        const currentFields = this.fields();
        const currentValues = this.selectedValues();
        return currentValues.units === "lbs" ? currentFields.lbsBarWeights : currentFields.kgBarWeights;
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

    trackByWarmupSet(index: number, set: { reps: number; weight: number; percentage: string | number }): string {
        return `${set.reps}-${set.weight}-${set.percentage}`;
    }
}
