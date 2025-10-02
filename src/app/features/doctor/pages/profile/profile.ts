import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule,
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatSelectModule }    from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule }      from '@angular/material/icon';
import { MatButtonModule }    from '@angular/material/button';
import { MatDividerModule }   from '@angular/material/divider';
import { MatTooltipModule }   from '@angular/material/tooltip';

type PriceRow = { country:string; currency:string; chat:number; voice:number; video:number; };

type PreviewModel = {
  name:string; title:string; dept:string; exp:number; lic:string;
  avatar:string; about:string;
  langs:string[]; hosps:string[]; edu:string[]; certs:string[];
  prices: PriceRow[];
};

@Component({
  standalone: true,
  selector: 'app-doc-profile',
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSlideToggleModule, MatIconModule, MatButtonModule,
    MatDividerModule, MatTooltipModule,
  ],
})
export class DocProfileComponent {
  departments = ['Pediatrics','Cardiology','Dermatology','Psychiatry','Neurology','Orthopedics','ENT','Dentistry','General'];
  meetProviders = ['Google Meet','Zoom','Microsoft Teams','Webex'];

  form!: FormGroup;
  private _preview!: PreviewModel;

  constructor(private fb: FormBuilder){
    this.form = this.buildForm();

    // initial preview
    this._preview = this.toPreview(this.form.getRawValue());

    // keep preview syncing without signals (no styling side-effects)
    this.form.valueChanges.subscribe(v => {
      this._preview = this.toPreview(v ?? {});
    });
  }

  // —— form factory ——
  private buildForm(): FormGroup {
    const n = this.fb.nonNullable;
    return n.group({
      name:            n.control<string>(''),
      title:           n.control<string>(''),
      department:      n.control<string>('Pediatrics'),
      yearsExperience: n.control<number>(0),
      licenseNumber:   n.control<string>(''),
      avatar:          n.control<string>('https://i.pravatar.cc/160?img=15'),
      about:           n.control<string>(''),

      languages:    n.array<string>(['Arabic','English']),
      hospitals:    n.array<string>(['Medtik Virtual Clinic']),
      education:    n.array<string>(['MBBCh']),
      certificates: n.array<string>([]),

      modalitiesEnabled: n.group({
        chat:  n.control<boolean>(true),
        voice: n.control<boolean>(true),
        video: n.control<boolean>(true),
      }),
      externalMeetProvider: n.control<string>('Google Meet'),

      prices: n.array<FormGroup>([
        this.priceRow('EG','EGP',80,120,180),
        this.priceRow('SA','SAR',90,140,200),
        this.priceRow('AE','AED',60,95,150),
      ]),

      policies: n.group({
        cancellation: n.control<string>('Free cancellation up to 2 hours'),
        refund:       n.control<string>('No-show refunds are not available'),
        reschedule:   n.control<string>('Reschedule up to 30 minutes'),
      }),
    });
  }

  // —— typed shortcuts for template ——
  get fc() {
    return {
      name: this.form.get('name') as FormControl<string>,
      title: this.form.get('title') as FormControl<string>,
      department: this.form.get('department') as FormControl<string>,
      yearsExperience: this.form.get('yearsExperience') as FormControl<number>,
      licenseNumber: this.form.get('licenseNumber') as FormControl<string>,
      avatar: this.form.get('avatar') as FormControl<string>,
      about: this.form.get('about') as FormControl<string>,
      externalMeetProvider: this.form.get('externalMeetProvider') as FormControl<string>,
    };
  }
  get mods() { return this.form.get('modalitiesEnabled') as FormGroup; }
  get ctrlChat()  { return this.mods.get('chat')  as FormControl<boolean>; }
  get ctrlVoice() { return this.mods.get('voice') as FormControl<boolean>; }
  get ctrlVideo() { return this.mods.get('video') as FormControl<boolean>; }

  get polCancellation() { return this.form.get('policies.cancellation') as FormControl<string>; }
  get polRefund()       { return this.form.get('policies.refund')       as FormControl<string>; }
  get polReschedule()   { return this.form.get('policies.reschedule')   as FormControl<string>; }

  array(name:'languages'|'hospitals'|'education'|'certificates'){
    return this.form.get(name) as FormArray<FormControl<string>>;
  }

  private priceRow(country='', currency='', chat=0, voice=0, video=0){
    const n = this.fb.nonNullable;
    return n.group({
      country:  n.control<string>(country),
      currency: n.control<string>(currency),
      chat:     n.control<number>(chat),
      voice:    n.control<number>(voice),
      video:    n.control<number>(video),
    });
  }
  get priceArray(){ return this.form.get('prices') as FormArray<FormGroup>; }
  priceGroups(): FormGroup[] { return this.priceArray.controls as FormGroup[]; }
  addPriceRow(){ this.priceArray.push(this.priceRow()); }
  removePriceRow(i:number){ this.priceArray.removeAt(i); }
  trackIndex = (i:number) => i;

  // —— chips ——
  onChipEnter(which:'languages'|'hospitals'|'education'|'certificates', ev: Event){
    const input = ev.target as HTMLInputElement;
    const v = (input?.value || '').trim();
    if(!v) return;
    this.array(which).push(this.fb.nonNullable.control<string>(v));
    input.value = '';
  }
  removeChip(which:'languages'|'hospitals'|'education'|'certificates', i:number){
    this.array(which).removeAt(i);
  }

  reset(){ this.form.reset(this.form.getRawValue()); }
  save(){ /* integrate with backend later */ }

  // —— public preview API used by template (keeps your HTML unchanged) ——
  preview = () => this._preview;

  private toPreview(v:any): PreviewModel {
    return {
      name: v?.name || 'Doctor name',
      title: v?.title || 'Specialty',
      dept:  v?.department || 'General',
      exp:   v?.yearsExperience || 0,
      lic:   v?.licenseNumber || '',
      avatar: v?.avatar || '',
      about: v?.about || '',
      langs: (v?.languages ?? []) as string[],
      hosps: (v?.hospitals ?? []) as string[],
      edu:   (v?.education ?? []) as string[],
      certs: (v?.certificates ?? []) as string[],
      prices: (v?.prices ?? []) as PriceRow[],
    };
  }

  priceLabel(row: PriceRow, which:'chat'|'voice'|'video'){ return `${row[which]} ${row.currency}`; }
}
