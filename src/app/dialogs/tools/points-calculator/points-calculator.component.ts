import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { AccountService } from '../../../services/account/account.service';

@Component({
  selector: 'app-points-calculator',
  templateUrl: './points-calculator.component.html',
  styleUrls: ['./points-calculator.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    FormsModule,
    DecimalPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PointsCalculatorComponent implements OnInit {
    private dialogRef = inject(MatDialogRef<PointsCalculatorComponent>);
    private accountService = inject(AccountService);

    selectedValues = signal<any>({
        weight: null,
        units: null,
        bodyWeight: null,
        event: null,
        category: null,
        gender: null
    });
    
    user = signal<any>({});
    bodyweight = signal<number | null>(null);

    constructor() { }

    ngOnInit(): void {
        this.accountService.getAccountObservable().subscribe((user: any) => {
            if (user && user.id) {
                this.user.set(user);
                this.selectedValues.update(v => ({
                    ...v,
                    units: user.units,
                    gender: user.gender
                }));
            }
        });
        
        const bw = this.bodyweight();
        if (bw) {
            this.selectedValues.update(v => ({ ...v, bodyWeight: bw }));
        }
    }

    cancel(): void {
        this.dialogRef.close();
    }

    updateWeight(value: any): void {
        this.selectedValues.update(v => ({ ...v, weight: value }));
    }

    updateGender(value: string): void {
        this.selectedValues.update(v => ({ ...v, gender: value }));
    }

    updateUnits(value: string): void {
        this.selectedValues.update(v => ({ ...v, units: value }));
    }

    updateBodyWeight(value: any): void {
        this.selectedValues.update(v => ({ ...v, bodyWeight: value }));
    }

    updateEvent(value: string): void {
        this.selectedValues.update(v => ({ ...v, event: value }));
    }

    updateCategory(value: string): void {
        this.selectedValues.update(v => ({ ...v, category: value }));
    }

    calculateOldWilks(bodyWeight:number, weightLifted:number, gender:string): number {
        const isFemale = gender === "Male" ? false : true;

        if (this.selectedValues().units === "lbs"){
            weightLifted = this.convertLbsToKg(weightLifted);
            bodyWeight = this.convertLbsToKg(bodyWeight);
        }

      

        var maleCoeff = [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-6, -1.291e-8];
        var femaleCoeff = [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 4.731582e-5, -9.054e-8];
        var denominator = isFemale ? femaleCoeff[0] : maleCoeff[0];
        var coeff = isFemale ? femaleCoeff : maleCoeff;
        var minbw = isFemale ? 26.51 : 40;
        var maxbw = isFemale ? 154.53 : 201.9;
        var bw = Math.min(Math.max(bodyWeight, minbw), maxbw);
      
        for (var i = 1; i < coeff.length; i++) {
          denominator += coeff[i] * Math.pow(bw, i);
        }
      
        var score = 500 / denominator * weightLifted;
        return score;
      }
      
      calculateNewWilks(bodyWeight:number, weightLifted:number, gender:string): number {
        const isFemale = gender === "Male" ? false : true;

        if (this.selectedValues().units === "lbs"){
            weightLifted = this.convertLbsToKg(weightLifted);
            bodyWeight = this.convertLbsToKg(bodyWeight);
        }
        var maleCoeff = [47.4617885411949, 8.47206137941125, 0.073694103462609, -1.39583381094385e-3, 7.07665973070743e-6, -1.20804336482315e-8];
        var femaleCoeff = [-125.425539779509, 13.7121941940668, -0.0330725063103405, -1.0504000506583e-3, 9.38773881462799e-6, -2.3334613884954e-8];
        var denominator = isFemale ? femaleCoeff[0] : maleCoeff[0];
        var coeff = isFemale ? femaleCoeff : maleCoeff;
        var minbw = 40;
        var maxbw = isFemale ? 150.95 : 200.95;
        var bw = Math.min(Math.max(bodyWeight, minbw), maxbw);
      
        for (var i = 1; i < coeff.length; i++) {
          denominator += coeff[i] * Math.pow(bw, i);
        }
      
        var score = 600 / denominator * weightLifted;
        return score;
      }
      
      calculateDOTS(bodyWeight:number, weightLifted:number, gender:string): number {
        const isFemale = gender === "Male" ? false : true;

        if (this.selectedValues().units === "lbs"){
            weightLifted = this.convertLbsToKg(weightLifted);
            bodyWeight = this.convertLbsToKg(bodyWeight);
        }
        var maleCoeff = [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093];
        var femaleCoeff = [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706];
        var denominator = isFemale ? femaleCoeff[0] : maleCoeff[0];
        var coeff = isFemale ? femaleCoeff : maleCoeff;
        var maxbw = isFemale ? 150 : 210;
        var bw = Math.min(Math.max(bodyWeight, 40), maxbw);
      
        for (var i = 1; i < coeff.length; i++) {
          denominator += coeff[i] * Math.pow(bw, i);
        }
      
        var score = 500 / denominator * weightLifted;
        return score;
      }
      
      calculateIPF(bodyWeight:number, weightLifted:number, gender:string, event:string, category: string): number {
        const isFemale = gender === "Male" ? false : true;

        if (this.selectedValues().units === "lbs"){
            weightLifted = this.convertLbsToKg(weightLifted);
            bodyWeight = this.convertLbsToKg(bodyWeight);
        }

        let competition = "";
        if (event === "equipped"){
            competition += "EQ";
        }
        else {
            competition += "CL"
        }

        if (category === "bench"){
            competition += "BN";
        }
        else{
            competition += "PL";
        }

        var maleCoeffCLPL = [310.67, 857.785, 53.216, 147.0835];
        var maleCoeffCLBN = [86.4745, 259.155, 17.5785, 53.122];
        var maleCoeffEQPL = [387.265, 1121.28, 80.6324, 222.4896];
        var maleCoeffEQBN = [133.94, 441.465, 35.3938, 113.0057];
        var femaleCoeffCLPL = [125.1435, 228.03, 34.5246, 86.8301];
        var femaleCoeffCLBN = [25.0485, 43.848, 6.7172, 13.952];
        var femaleCoeffEQPL = [176.58, 373.315, 48.4534, 110.0103];
        var femaleCoeffEQBN = [49.106, 124.209, 23.199, 67.4926];
        var coeff;
      
        if (isFemale) {
          switch (competition) {
            case "CLBN":
              coeff = femaleCoeffCLBN;
              break;
      
            case "EQPL":
              coeff = femaleCoeffEQPL;
              break;
      
            case "EQBN":
              coeff = femaleCoeffEQBN;
              break;
      
            case "CLPL":
            default:
              coeff = femaleCoeffCLPL;
              break;
          }
        } else {
          switch (competition) {
            case "CLBN":
              coeff = maleCoeffCLBN;
              break;
      
            case "EQPL":
              coeff = maleCoeffEQPL;
              break;
      
            case "EQBN":
              coeff = maleCoeffEQBN;
              break;
      
            case "CLPL":
            default:
              coeff = maleCoeffCLPL;
              break;
          }
        }
      
        if (bodyWeight < 40) return 0;
        var lnbw = Math.log(bodyWeight);
        var score = 500 + 100 * ((weightLifted - (coeff[0] * lnbw - coeff[1])) / (coeff[2] * lnbw - coeff[3]));
        return score < 0 ? 0 : score;
      }
      
      calculateIPFGL(bodyWeight:number, weightLifted:number, gender:string, event:string, category:string): number {
        const isFemale = gender === "Male" ? false : true;

        if (this.selectedValues().units === "lbs"){
            weightLifted = this.convertLbsToKg(weightLifted);
            bodyWeight = this.convertLbsToKg(bodyWeight);
        }


        let competition = "";
        if (event === "equipped"){
            competition += "EQ";
        }
        else {
            competition += "CL"
        }

        if (category === "bench"){
            competition += "BN";
        }
        else{
            competition += "PL";
        }


        var maleCoeffCLPL = [1199.72839, 1025.18162, 0.00921];
        var maleCoeffCLBN = [320.98041, 281.40258, 0.01008];
        var maleCoeffEQPL = [1236.25115, 1449.21864, 0.01644];
        var maleCoeffEQBN = [381.22073, 733.79378, 0.02398];
        var femaleCoeffCLPL = [610.32796, 1045.59282, 0.03048];
        var femaleCoeffCLBN = [142.40398, 442.52671, 0.04724];
        var femaleCoeffEQPL = [758.63878, 949.31382, 0.02435];
        var femaleCoeffEQBN = [221.82209, 357.00377, 0.02937];
        var coeff;
      
        if (isFemale) {
          switch (competition) {
            case "CLBN":
              coeff = femaleCoeffCLBN;
              break;
      
            case "EQPL":
              coeff = femaleCoeffEQPL;
              break;
      
            case "EQBN":
              coeff = femaleCoeffEQBN;
              break;
      
            case "CLPL":
            default:
              coeff = femaleCoeffCLPL;
              break;
          }
        } else {
          switch (competition) {
            case "CLBN":
              coeff = maleCoeffCLBN;
              break;
      
            case "EQPL":
              coeff = maleCoeffEQPL;
              break;
      
            case "EQBN":
              coeff = maleCoeffEQBN;
              break;
      
            case "CLPL":
            default:
              coeff = maleCoeffCLPL;
              break;
          }
        }
      
        if (bodyWeight < 35) return 0;
        var power = -coeff[2] * bodyWeight;
        var score = weightLifted * (100 / (coeff[0] - coeff[1] * Math.pow(Math.E, power)));
        return score < 0 ? 0 : score;
      }



      private convertLbsToKg(weight:number): number {
        return weight/2.2046;
      }
}
