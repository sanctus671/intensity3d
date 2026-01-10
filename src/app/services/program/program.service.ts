import { Injectable } from '@angular/core';
import { RequestService } from '../request/request.service';
import { StorageService } from '../storage/storage.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  private programsObservable: BehaviorSubject<any>;

  constructor(
    private request: RequestService,
    private storage: StorageService
  ) {
    this.programsObservable = new BehaviorSubject<any>(null);
  }

  getProgramsObservable() {
    return this.programsObservable.asObservable();
  }

  setProgramsObservable(update: any) {
    this.programsObservable.next(update);
  }

  saveProgramDraft(program: string) {
    return this.storage.set('intensity__draftprogram', program);
  }

  removeProgramDraft() {
    return this.storage.remove('intensity__draftprogram');
  }

  getProgramDraft() {
    return this.storage.get('intensity__draftprogram');
  }

  getPrograms(): Promise<any> {
    return this.request.get('view', 'getprograms', 'programs', {});
  }

  getProgram(programId: number): Promise<any> {
    return this.request.get('view', 'getprograms', `program_${programId}`, { id: programId });
  }

  async getProgramLocal(programId: number): Promise<any> {
    try {
      const program = await this.storage.get(`intensityProgram${programId}`);
      if (!program) {
        throw new Error('No program in storage');
      }
      return typeof program === 'string' ? JSON.parse(program) : program;
    } catch (error) {
      throw new Error('No program in storage');
    }
  }

  createProgram(programData: any): Promise<any> {
    return this.request.modify('create', 'createfullprogram', { program: programData });
  }

  updateProgram(programId: number, programData: any): Promise<any> {
    return this.request.modify('edit', 'updatefullprogram', { program: programData });
  }

  deleteProgram(programId: number): Promise<any> {
    return this.request.modify('edit', 'deleteprogram', { id: programId });
  }

  addProgram(details: any): Promise<any> {
    return this.request.modify('create', 'addresults', details);
  }

  addWorkout(workoutId: number, date: string): Promise<any> {
    return this.request.modify('create', 'addresults', { workoutid: workoutId, assigneddate: date });
  }

  getRecentPrograms(): Promise<any> {
    return this.request.get('view', 'selectresults', 'recent_programs', { type: 'programs', limit: 99 });
  }

  getCreatedPrograms(userId: number): Promise<any> {
    return this.request.get('view', 'getprograms', `created_programs_${userId}`, { userid: userId });
  }

    
    
  public getPopularPrograms(){
    return [

        {id: 12, displayName:"5/3/1", name:"5/3/1", subtitle: "4 Weeks", image: "https://api.intensityapp.com/uploads/531.jpg"},     
        {id: 208, displayName:"Candito Strength Program", name:"Candito 6 Week Strength Program", subtitle: "6 Weeks", image: "https://api.intensityapp.com/uploads/candito.jpg"},
        {id: 235, displayName:"The Juggernaut Method", name:"The Juggernaut Method", subtitle: "16 Weeks", image: "https://api.intensityapp.com/uploads/juggernaut.jpg"},       
        {id: 50, displayName:"StrongLifts 5x5", name:"StrongLifts 5x5", subtitle: "Alternating Workouts", image: "https://api.intensityapp.com/uploads/stronglifts.jpg"},
        {id: 10, displayName:"Starting Strength", name:"Starting Strength", subtitle: "Alternating Workouts", image: "https://api.intensityapp.com/uploads/startingstrength.jpg"},        
        
    ];
}
    
public getPowerliftingPrograms(){
    return [     
        {id: 220, displayName: "Sheiko", name:"Sheiko #29", subtitle: "4 Weeks", image: "https://api.intensityapp.com/uploads/sheiko.jpg"},      
        {id: 7817, displayName: "nSuns", name:"nSuns", subtitle: "Weekly", image: "https://api.intensityapp.com/uploads/nsuns.jpg"},   
        {id: 217, displayName: "The Cube Method", name:"The Cube Method", subtitle: "10 Weeks", image: "https://api.intensityapp.com/uploads/cube.jpg"},   
        {id: 7984, displayName: "GZCLP", name:"GZCL Program (GZCLP) - 4 days/week", subtitle: "12 Weeks", image: "https://api.intensityapp.com/uploads/gzcl.jpg"},                 
        {id: 8106, displayName:"TSA Intermediate Program", name:"TSA 9 Week Intermediate Approach", subtitle: "9 Weeks", image: "https://api.intensityapp.com/uploads/tsa.jpg"},
        {id: 7818, displayName: "Candito Squat Program", name:"Candito Advanced 9 Week Squat Program", subtitle: "9 Weeks", image: "https://api.intensityapp.com/uploads/canditosquat.jpg"},
        {id: 7819, displayName: "Calgary Barbell Program", name:"Calgary Barbell Program", subtitle: "16 Weeks", image: "https://api.intensityapp.com/uploads/calgary.jpg"},    
        {id: 7989, displayName:"70s Powerlifter", name:"70s Powerlifter", subtitle: "18 Weeks", image: "https://api.intensityapp.com/uploads/70s.jpg"},    
        {id: 8013, displayName: "Matt Vena Intermediate Program", name:"Matt Vena Intermediate Powerlifting Program", subtitle: "12 Weeks", image: "https://api.intensityapp.com/uploads/mattvena.jpg"},
        {id: 13, displayName:"Smolov", name:"Smolov", subtitle: "13 Weeks", image: "https://api.intensityapp.com/uploads/smolov.jpg"},  
        {id: 53, displayName:"Smolov Jr", name:"Smolov Jr", subtitle: "3 Weeks", image: "https://api.intensityapp.com/uploads/smolovjr.jpg"},                 
        {id: 219, displayName:"Coan Philippi Deadlift Routine", name:"Coan Philippi Deadlift Routine", subtitle: "10 Weeks", image: "https://api.intensityapp.com/uploads/coan.jpg"}, 
        {id: 222, displayName:"The Conjugate Method", name:"The Conjugate Method by Westside Barbell", subtitle: "3 Weeks", image: "https://api.intensityapp.com/uploads/conjugate.jpg"},
        {id: 8109, displayName: "Bradley Barbell's Bench PR", name:"Bradley Barbell's Bench PR", subtitle: "6 Weeks", image: "https://api.intensityapp.com/uploads/bradleybench.jpg"},
        ];        
}    

public getBodybuildingPrograms(){
    return [    
        {id: 8129, displayName:"Push Pull Legs", name:"Push Pull Legs", subtitle: "Weekly Split", image: "https://api.intensityapp.com/uploads/ppl.jpg"}, 
        {id: 216, displayName: "Layne Norton's PHAT", name:"Layne Norton PHAT", subtitle: "Weekly Bodypart Split", image: "https://api.intensityapp.com/uploads/layne.jpg"}, 
        {id: 2359, displayName: "Jeff Nippard's Hypertrophy Program", name:"Jeff Nippard's Hypertrophy Program", subtitle: "16 Weeks Push/Pull/Legs", image: "https://api.intensityapp.com/uploads/jeff.jpg"},  
        {id: 114, displayName: "Upper/Lower Split", name:"Power Hypertrophy UL", subtitle: "Weekly Split", image: "https://api.intensityapp.com/uploads/upperlower.jpg"},
        {id: 7983, displayName: "Eric Helms Bodybuilding Program", name:"Intermediate Bodybuilding Program (by Eric Helms)", subtitle: "12 Weeks", image: "https://api.intensityapp.com/uploads/eric.jpg"},
        {id: 171, displayName: "5 Day Split", name:"Gorillafinger 5 Day Split", subtitle: "Weekly Bodypart Split", image: "https://api.intensityapp.com/uploads/gorilla.jpg"},
        {id: 8018, displayName: "Push Pull Legs Upper Lower", name:"Push Pull Legs Upper Lower (PPLUL)", subtitle: "Weekly Split", image: "https://api.intensityapp.com/uploads/pplul.jpg"},      
        {id: 7987, displayName: "Metallicadpa PPL", name:"Metallicadpa PPL", subtitle: "12 Weeks Push/Pull/Legs", image: "https://api.intensityapp.com/uploads/reddit.jpg"},       
        {id: 8015, displayName: "KONG by Alexander Bromley", name:"KONG: Savage Size in 12 Weeks", subtitle: "12 Weeks", image: "https://api.intensityapp.com/uploads/kong.jpg"}, 
        {id: 8007, displayName: "Guts Training Program", name:"Guts Training Program - Black Swordman Variation", subtitle: "Weekly Upper/Lower Split", image: "https://api.intensityapp.com/uploads/guts.jpg"}, 
        {id: 7972, displayName: "RAVAGE by Geoffrey Schofield", name:"RAVAGE by Geoffrey Schofield", subtitle: "Weekly Bodypart Split", image: "https://api.intensityapp.com/uploads/ravage.jpg"},         
    ];         
}     

public getPowerbuildingPrograms(){
    return [ 
        {id: 2356, displayName: "Kizen Infinite Off-Season", name:"Kizen 4 Week Infinite Off-Season", subtitle: "5 Weeks", image: "https://api.intensityapp.com/uploads/kizen.jpg"},                  
        {id: 8006, displayName: "Jacked and Tan 2.0", name:"Jacked and Tan 2.0 - GZCL", subtitle: "12 Weeks", image: "https://api.intensityapp.com/uploads/jackedtan.jpg"},
        {id: 8014, displayName: "PHUL", name:"PHUL by Brandon Campbell", subtitle: "Weekly Upper/Lower Split", image: "https://api.intensityapp.com/uploads/brandon.jpg"},   
        {id: 8108, displayName: "Full Body Powerbuilding", name:"Full Body Powerbuilding Split", subtitle: "Weekly Fullbody Split", image: "https://api.intensityapp.com/uploads/fullbody.jpg"},
        {id: 7820, displayName: "Greyskull LP", name:"Greyskull LP", subtitle: "Alternating Workouts", image: "https://api.intensityapp.com/uploads/greyskull.jpg"}, 
        {id: 2129, displayName: "Layne Norton's PH3", name:"Layne Norton's Ph3 (no accessories)", subtitle: "13 Weeks", image: "https://api.intensityapp.com/uploads/ph3.jpg"},  
        {id: 8117, displayName: "German Volume Training", name:"German Volume Training", subtitle: "Weekly Fullbody Split", image: "https://api.intensityapp.com/uploads/german.jpg"},
        {id: 7821, displayName: "PHUL Advanced", name:"PHUL Advanced", subtitle: "13 Weeks", image: "https://api.intensityapp.com/uploads/phuladvanced.jpg"},
    ];         
}   

public getWeightliftingPrograms(){
    return [                   
        {id: 7822, displayName: "Bulgarian Method", name:"Bulgarian Method", subtitle: "Weekly", image: "https://api.intensityapp.com/uploads/bulgarian.jpg"},
        {id: 7860, displayName: "Catalyst Athletics Program", name:"Catalyst Athletics Program", subtitle: "12 Weeks", image: "https://api.intensityapp.com/uploads/catalyst.jpg"},
        {id: 7873, displayName: "Torokhtiy Olympic Weightlifting Program", name:"Torokhtiy Olympic Weightlifting Program", subtitle: "13 Weeks", image: "https://api.intensityapp.com/uploads/torokhtiy.jpg"},
    ];         
}   

public getStrongmanPrograms(){
    return [               
        {id: 7874, displayName: "5/3/1 for Strongman", name:"5/3/1 for Strongman", subtitle: "8 Weeks", image: "https://api.intensityapp.com/uploads/531strongman.jpg"},    
        {id: 8118, displayName: "Fullsterkur Strongman Program", name:"Fullsterkur Strongman Program", subtitle: "12 Weeks", image: "https://api.intensityapp.com/uploads/fullsterkur.jpg"},
        {id: 7825, displayName: "Cube Method for Strongman", name:"Cube Method for Strongman", subtitle: "4 Weeks", image: "https://api.intensityapp.com/uploads/cubestrongman.jpg"},
        {id: 7871, displayName: "Brian Alsruhe's Dark Horse Program", name:"Brian Alsruhe's Dark Horse Program", subtitle: "9 Weeks", image: "https://api.intensityapp.com/uploads/darkhorse.jpg"},
    ];         
} 

  public getRecommendedPrograms(){
    return [    
        {id: 12, displayName:"5/3/1", name:"5/3/1", subtitle: "4 Weeks", image: "https://api.intensityapp.com/uploads/531.jpg"},
        {id: 235, displayName:"The Juggernaut Method", name:"The Juggernaut Method", subtitle: "16 Weeks", image: "https://api.intensityapp.com/uploads/juggernaut.jpg"},            
        {id: 208, displayName:"Candito Strength Program", name:"Candito 6 Week Strength Program", subtitle: "6 Weeks", image: "https://api.intensityapp.com/uploads/candito.jpg"},
        {id: 50, displayName:"StrongLifts 5x5", name:"StrongLifts 5x5", subtitle: "Alternating Workouts", image: "https://api.intensityapp.com/uploads/stronglifts.jpg"},
        {id: 10, displayName:"Starting Strength", name:"Starting Strength", subtitle: "Alternating Workouts", image: "https://api.intensityapp.com/uploads/startingstrength.jpg"},
        {id: 13, displayName:"Smolov", name:"Smolov", subtitle: "13 Weeks", image: "https://api.intensityapp.com/uploads/smolov.jpg"},               
        {id: 220, displayName: "Sheiko", name:"Sheiko #29", subtitle: "4 Weeks", image: "https://api.intensityapp.com/uploads/sheiko.jpg"},
        {id: 217, displayName: "The Cube Method", name:"The Cube Method", subtitle: "10 Weeks", image: "https://api.intensityapp.com/uploads/cube.jpg"},
        {id: 2129, displayName: "Layne Norton's PH3", name:"Layne Norton's Ph3 (no accessories)", subtitle: "13 Weeks", image: "https://api.intensityapp.com/uploads/ph3.jpg"},
        {id: 2356, displayName: "Kizen Infinite Off-Season", name:"Kizen 4 Week Infinite Off-Season", subtitle: "5 Weeks", image: "https://api.intensityapp.com/uploads/kizen.jpg"},        
        {id: 54, displayName: "Smolov Jr Bench", name:"Smolov Jr Bench", subtitle: "3 Weeks", image: "https://api.intensityapp.com/uploads/smolovbench.jpg"},
        {id: 212, displayName: "PowerliftingToWin", name:"PowerliftingToWin Intermediate Program 1", subtitle: "Alternating Workouts", image: "https://api.intensityapp.com/uploads/ptw.jpg"},
        {id: 222, displayName:"The Conjugate Method", name:"The Conjugate Method by Westside Barbell", subtitle: "3 Weeks", image: "https://api.intensityapp.com/uploads/conjugate.jpg"},
        {id: 219, displayName:"Deadlift Routine", name:"Coan Philippi Deadlift Routine", subtitle: "10 Weeks", image: "https://api.intensityapp.com/uploads/coan.jpg"},
        {id: 53, displayName:"Smolov Jr", name:"Smolov Jr", subtitle: "3 Weeks", image: "https://api.intensityapp.com/uploads/smolovjr.jpg"},                       
        {id: 216, displayName: "Layne Norton PHAT", name:"Layne Norton PHAT", subtitle: "Weekly Bodypart Split", image: "https://api.intensityapp.com/uploads/layne.jpg"},
        {id: 2359, displayName: "Jeff Nippard's Hypertrophy Program", name:"Jeff Nippard's Hypertrophy Program", subtitle: "16 Weeks Push/Pull/Legs", image: "https://api.intensityapp.com/uploads/jeff.jpg"},
        {id: 171, displayName: "Gorillafinger 5 Day Split", name:"Gorillafinger 5 Day Split", subtitle: "Weekly Bodypart Split", image: "https://api.intensityapp.com/uploads/gorilla.jpg"},
        {id: 114, displayName: "Power Hypertrophy", name:"Power Hypertrophy UL", subtitle: "Weekly Upper/Lower Split", image: "https://api.intensityapp.com/uploads/upperlower.jpg"},
        {id: 64, displayName: "German Volume Training", name:"German Volume Training", subtitle: "Weekly Fullbody Split", image: "https://api.intensityapp.com/uploads/german.jpg"},
    ];          
} 


  getActivePrograms(): Promise<any> {
    // Get active programs from the diary (programs currently being followed)
    return this.request.get('view', 'getactiveprograms', 'active_programs', {});
  }

  getWorkoutsForProgram(start: string, end: string): Promise<any> {
    return this.request.get('view', 'getworkoutsforprogram', `workouts_for_program_${start}_${end}`, { start, end });
  }

  getProgramWorkouts(programId: number): Promise<any> {
    return this.request.get('view', 'getprogramworkouts', `program_workouts_${programId}`, { programid: programId });
  }

  getWorkout(workoutId: number): Promise<any> {
    return this.request.get('view', 'getworkouts', `workout_${workoutId}`, { id: workoutId });
  }

  getMaxes(exerciseIds: any): Promise<any> {
    return this.request.get('view', 'massgetmax', 'exercise_maxes', { exerciseids: exerciseIds });
  }

  updateExerciseMaxes(maxes: any): Promise<any> {
    return this.request.modify('create', 'massaddstats', { maxes });
  }

  updateProgramMaxes(updateType: string, programId: number, addId: number, assigneddate: string): Promise<any> {
    return this.request.modify('edit', 'updateprogrammaxes', { 
      type: updateType, 
      programid: programId, 
      addid: addId, 
      assigneddate 
    });
  }
}
