import { Component } from '@angular/core';
import { Sudoku } from './core/models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  sudoku = new Sudoku();

  constructor() {}

  populateBoard() {
    this.sudoku.populateBoard();
  }

  removeNumbers() {
    this.sudoku.removeNumbersFromBoard();
  }
}
