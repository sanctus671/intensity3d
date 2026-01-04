import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'programSearch'
})
export class ProgramSearchPipe implements PipeTransform {
  transform(programs: any[], searchTerm: string): any[] {
    if (!programs || !searchTerm) {
      return programs;
    }

    const lowerSearch = searchTerm.toLowerCase();
    
    return programs.filter(program =>
      program.name.toLowerCase().includes(lowerSearch) ||
      (program.description && program.description.toLowerCase().includes(lowerSearch))
    );
  }
}
