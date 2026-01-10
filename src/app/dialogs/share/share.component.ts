import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { TranslateModule } from '@ngx-translate/core';
import { ShareButtons } from 'ngx-sharebuttons/buttons';



@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    CdkTextareaAutosize,
    TranslateModule,
    ShareButtons
  ]
})
export class ShareComponent {
    
    public dialogRef = inject(MatDialogRef<ShareComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private snackBar = inject(MatSnackBar);
    
    public title: string;
    public description: string;
    public link: string;
    public shareType: string;
    public details: any;
    public exercise: any;
    public workout: Array<any> = [];
    public showShareTypeSelector: boolean;
    
    constructor() {
        this.title = this.data.title ? this.data.title : "Share";
        this.description = this.data.description ? this.data.description : "";
        this.link = this.data.link ? this.data.link : "https://www.intensityapp.com/";
        this.shareType = this.data.shareType ? this.data.shareType : "";
        this.showShareTypeSelector = this.data.showShareTypeSelector !== undefined ? this.data.showShareTypeSelector : true;
        
        this.details = {};
        
        if (this.shareType === "workout"){
            this.details.type = "sets";
            
            this.exercise = this.data.exercise ? this.data.exercise : {sets:[]};
            this.workout = this.data.workout ? this.data.workout : [];
            this.generateWorkoutDescription();
        }
    }
    
    public generateWorkoutDescription(): void {
        let setText = this.title + "\n\n";
        if (this.details.type === "workout"){
            for (let exercise of this.workout){
                setText = setText + this.generateExerciseText(exercise);      
            }              
        } else {
            setText = setText + this.generateExerciseText(this.exercise); 
        }
        
        this.description = setText.replace(/\n$/, "");
    }
    
    private generateExerciseText(exercise: any): string {
        let setText = "* " + exercise.name + " * \n";
        for (let set of exercise.sets){
            setText = setText + "- " + set.weight + set.unit + " x " + set.reps;
            if (set.percentage || set.rpe){
                setText = setText + " (" + (set.percentage ?  (set.percentage + "%") : "") + 
                (set.percentage && set.rpe ? ", " : "") +
                (set.rpe ? (set.rpe + "RPE" ) : "") + ") \n";
            }
        }    
        
        return setText + "\n";         
    }
    
    public copyText(): void {
        let copyText: any = document.getElementById("share-text");
        copyText.select();
        document.execCommand("copy");
        document.getSelection()?.removeAllRanges();
        this.snackBar.open('Text copied!', '', {
            duration: 5000
        });         
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
