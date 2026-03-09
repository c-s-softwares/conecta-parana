import { Component, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgClass],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly environmentName = computed(() => environment.name);

  protected readonly environmentBadgeClass = computed(() => {
    switch (environment.name) {
      case 'production':
        return 'bg-green-100 text-green-800';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  });
}
