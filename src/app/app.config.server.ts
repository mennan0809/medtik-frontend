import { ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

export const config: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideNoopAnimations(),
  ],
};
