# Pricing Sync Verification Report

**Hospital:** KBH  
**Test patients:** 600  
**Billables checked:** 3314  
**Generated:** 2026-04-14T12:40:50.275Z

## Summary

| Status | Count |
|--------|------:|
| 🟢 PASS | 4771 |
| 🔴 FAIL | 0 |
| 🟡 WARN | 0 |

## Pricing Blob Snapshot

```json
{
  "wards": {
    "Private Ward": {
      "ICU": 400,
      "VIP": 600,
      "General": 80,
      "Private": 250,
      "Semi-Private": 150
    },
    "Surgical Ward": {
      "ICU": 400,
      "VIP": 600,
      "General": 80,
      "Private": 250,
      "Semi-Private": 150
    },
    "Maternity Ward": {
      "ICU": 400,
      "VIP": 600,
      "General": 80,
      "Private": 250,
      "Semi-Private": 150
    },
    "Pediatric Ward": {
      "ICU": 400,
      "VIP": 600,
      "General": 80,
      "Private": 250,
      "Semi-Private": 150
    },
    "Male General Ward": {
      "ICU": 400,
      "VIP": 600,
      "General": 80,
      "Private": 250,
      "Semi-Private": 150
    },
    "Female General Ward": {
      "ICU": 400,
      "VIP": 600,
      "General": 80,
      "Private": 250,
      "Semi-Private": 150
    },
    "Intensive Care Unit": {
      "ICU": 400,
      "VIP": 600,
      "General": 80,
      "Private": 250,
      "Semi-Private": 150
    },
    "Emergency Observation": {
      "ICU": 400,
      "VIP": 600,
      "General": 80,
      "Private": 250,
      "Semi-Private": 150
    }
  },
  "doctors": {
    "cmnvcbf6c000xcgvaopol0tgh": {
      "fee": 60,
      "commission": 15,
      "department": "general"
    },
    "cmnvekv34001rcgvanvbn17xs": {
      "fee": 40,
      "commission": 10,
      "department": "pediatrics"
    }
  },
  "defaults": {
    "vitalsFee": 5,
    "wardNightly": 120,
    "injectionFee": 15,
    "consultationFee": 50
  },
  "services": {
    "LAB": {
      "Urinalysis": 12,
      "Widal Test": 20,
      "Full Blood Count": 25,
      "Malaria Parasite": 15,
      "Random Blood Sugar": 10
    },
    "DRUG": {
      "Amoxicillin 500mg": 5,
      "Paracetamol 500mg": 2,
      "Artemether-Lumefantrine": 18
    },
    "ICU_DAY": {
      "ICU Day": 400,
      "Ventilator Day": 250
    },
    "IMAGING": {
      "CT Head": 400,
      "CT Abdomen": 450,
      "Chest X-Ray": 80,
      "Abdominal Ultrasound": 120
    },
    "EMERGENCY": {
      "Triage Level 1": 100,
      "Triage Level 2": 70,
      "Triage Level 3": 40
    },
    "PROCEDURE": {
      "IV Fluids": 20,
      "Suturing Minor": 60,
      "Wound Dressing": 30,
      "Delivery Normal": 500,
      "Blood Transfusion": 150
    }
  }
}
```

## Verification Rows

| Status | Section | Check | Expected | Actual | Note |
|--------|---------|-------|----------|--------|------|
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh3q8 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh3s5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh3uz | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh3wo | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh3yo | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh40q | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh42k | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh44e | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh474 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh48z | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh4aa | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh4bt | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh4d4 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh4ew | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh4gf | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh4i7 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh4jl | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh4lj | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh4n7 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh4pd | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh4r9 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh4tm | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh4v7 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh4x0 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh4yh | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh50a | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh52a | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh54m | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh56a | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh58f | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh5af | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh5bv | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh5ed | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh5g7 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh5hr | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh5jd | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh5li | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh5nr | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh5pr | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh5rf | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh5t5 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh5ul | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh5wc | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh5yc | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh5zx | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh61q | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh63j | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh65v | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh67w | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh69o | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh6cn | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh6em | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh6gl | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh6j5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh6ma | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh6o4 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh6pl | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh6s9 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh6ua | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh6wv | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh6ya | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh70f | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh728 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh741 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh767 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh78j | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh7at | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh7cx | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh7f2 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh7h5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh7jt | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh7mb | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh7p3 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh7rq | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh7y3 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh81k | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh84s | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh899 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh8aq | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh8cf | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh8e8 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh8g0 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh8hf | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh8jy | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh8lv | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh8og | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh8q8 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh8s4 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh8tz | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh8vs | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh8x6 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh8z1 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh90y | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh92r | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh94f | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh969 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh98h | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh9ac | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh9bw | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh9ec | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh9hv | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh9os | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh9r2 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyh9tp | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyh9x4 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyha04 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyha2n | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyha5h | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyha7u | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhabg | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhafz | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhaj5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhalv | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhanv | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhaqy | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhatg | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhaw3 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhayc | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhb0i | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhb2n | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhb51 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhb93 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhbcs | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhbeu | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhbhp | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhbl1 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhbn5 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhbpo | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhbs3 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhbue | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhbx0 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhbzf | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhc1l | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhc3z | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhc5u | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhc86 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhcae | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhcct | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhcf4 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhchl | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhcj5 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhcl5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhcnb | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhcp5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhcr6 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhctl | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhcw4 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhcye | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhd0k | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhd33 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhd5p | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhd82 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhda4 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhdcf | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhder | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhdh2 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhdjj | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhdlk | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhdo9 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhdr1 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhdt1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhdvd | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhdy1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhe0s | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhe30 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhe5q | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhe80 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyheat | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhedd | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhege | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyheiz | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhela | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyheni | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyheq9 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhet9 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhevp | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhexr | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhf0a | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhf2b | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhf4n | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhf70 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhf8o | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhfb2 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhfd8 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhffv | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhfhj | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhfjb | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhfly | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhfnq | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhfqe | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhfs9 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhfuk | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhfwc | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhfyc | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhg0m | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhg2f | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhg41 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhg5p | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhg7l | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhg9q | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhgbn | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhgde | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhgg4 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhgi8 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhgkp | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhgmg | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhgp0 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhgqp | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhgt3 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhgv6 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhgy1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhh0l | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhh2u | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhh5e | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhh7c | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhh9i | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhhbv | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhhep | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhhh1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhhj5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhhlt | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhhnr | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhhpq | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhhri | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhhtm | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhhvr | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhhy1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhhzx | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhi29 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhi47 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhi5y | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhi89 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhiaw | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhicv | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhieu | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhigp | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhiig | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhik2 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhima | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhio6 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhiqc | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhit7 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhiuq | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhiwz | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhiz1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhj12 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhj2q | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhj4m | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhj6j | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhja2 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjcj | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjdx | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjfb | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjhh | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjjt | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjlh | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjn5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjp0 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjqq | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjt8 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjvf | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjx4 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhjzg | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhk1u | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhk3j | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhk5w | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhk88 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhka5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkco | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkeh | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkgo | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkjd | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkkx | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkn4 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkoo | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkq1 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhksp | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkux | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkxg | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhkzv | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhl1l | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhl3p | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhl5t | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhl7s | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhl9m | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhlbq | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhlea | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhlgu | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhljl | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhllw | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhlnt | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhlps | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhlsj | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhlum | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhlw6 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhly6 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhlzz | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhm2k | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhm52 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhm77 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhm8z | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhmby | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhmdx | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhmgl | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhmjn | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhmll | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhmnu | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhmpo | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhmrv | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhmub | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhmws | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhmzk | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhn18 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhn3j | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhn7d | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhn9m | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhnbu | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhnee | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhngo | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhnj6 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhnl1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhnmv | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhnp2 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhnqm | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhntp | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhnvo | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhnxz | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyho0p | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyho4l | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyho67 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyho83 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyho9v | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhoc0 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhodw | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhogr | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhoi9 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhok7 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhom6 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhoo0 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhoqm | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhot6 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhov8 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhox3 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhoz5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhp1q | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhp38 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhp60 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhp7f | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhp92 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhpb3 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhpcw | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhpfp | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhph2 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhpiy | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhpkl | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhpmf | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhpoq | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhpqk | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhpt1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhpwo | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhpz6 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhq3g | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhq80 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhqca | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhqf1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhqi7 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhqls | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhqob | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhqrf | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhquj | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhqzc | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhr2b | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhr4g | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhr8l | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhrc7 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhrgq | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhrk6 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhrnf | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhrqo | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhrtr | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhrxc | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhs11 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhs4k | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhs8i | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhscx | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhsho | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhslv | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhsqg | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhstf | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhswd | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhszg | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyht1w | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyht53 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyht7d | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyht9u | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhtcl | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhtg4 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhtjo | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhtn5 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhtpw | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhtuf | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhtwx | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhtzr | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhu25 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhu4s | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhu6z | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhuac | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhucq | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhuek | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhugz | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhukg | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhum1 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhuo5 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhurn | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhuu5 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhuxz | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhv08 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhv2j | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhv4r | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhv6n | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhv8f | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhva7 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhvcx | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhvfu | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhvj5 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhvm9 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhvp4 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhvr8 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhvt1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhvuq | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhvyk | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhw0x | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhw3d | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhw4z | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhw7l | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhw9n | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhwbl | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhwdj | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhwff | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhwhi | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhwkc | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhwmj | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhwox | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhwr0 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhwtp | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhwwo | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhwyx | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhx0x | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhx2x | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhx6g | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhx8i | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhxc9 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhxel | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhxgb | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhxi8 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhxkj | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhxn8 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhxp4 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhxrg | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhxtd | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhxvq | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhxxj | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhxyz | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhy0u | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhy2y | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhy56 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhy73 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhy9a | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyhyb2 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyhyd5 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi3e7 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi3hx | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi3kk | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi3mh | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi3p5 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi3s4 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi3v3 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi3y4 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi41j | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi44m | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi47q | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi4ao | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi4d1 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi4fs | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi4iq | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi4le | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi4od | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi4ri | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi4u6 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi4xp | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi511 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi532 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi55u | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi587 | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi5an | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi5cq | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi5fl | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi5hc | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi5j9 | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi5li | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi5nr | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi5pq | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi5sl | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 40 | 40 |  |
| 🟢 | Commission | pct snapshot for Dr. Abena Mensah-Pedi | 10% | 10% |  |
| 🟢 | Commission | staffCutCost for cmnyi5ur | 4 | 4 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Abena Mensah-Ped | shiftId set | cmnygpp6 |  |
| 🟢 | Consultation | unitCost matches pricing.doctors[id].fee | 60 | 60 |  |
| 🟢 | Commission | pct snapshot for Dr. Kofi Asante | 15% | 15% |  |
| 🟢 | Commission | staffCutCost for cmnyi5xd | 9 | 9 |  |
| 🟢 | Shift | auto-attach for doctor Dr. Kofi Asante | shiftId set | cmnygppe |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "CT Abdomen" | 450 | 450 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | IMAGING | service catalog for "Chest X-Ray" | 80 | 80 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "CT Head" | 400 | 400 |  |
| 🟢 | IMAGING | service catalog for "Abdominal Ultrasound" | 120 | 120 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | ICU_DAY | service catalog for "ICU Day" | 400 | 400 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Widal Test" | 20 | 20 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 2" | 70 | 70 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Random Blood Sugar" | 10 | 10 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 3" | 40 | 40 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 3" | 40 | 40 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 1" | 100 | 100 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 2" | 70 | 70 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 1" | 100 | 100 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 2" | 70 | 70 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 1" | 100 | 100 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 3" | 40 | 40 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 3" | 40 | 40 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 2" | 70 | 70 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 1" | 100 | 100 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 2" | 70 | 70 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 1" | 100 | 100 |  |
| 🟢 | EMERGENCY | service catalog for "Triage Level 3" | 40 | 40 |  |
| 🟢 | LAB | service catalog for "Malaria Parasite" | 15 | 15 |  |
| 🟢 | LAB | service catalog for "Urinalysis" | 12 | 12 |  |
| 🟢 | LAB | service catalog for "Full Blood Count" | 25 | 25 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Cotton Swabs Pack" | override honored | 3 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "IV Cannula + Line" | override honored | 18 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | "Amlodipine 5mg" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | batch sellPrice wins for "Amoxicillin 500mg" | >5 (blob) | 6 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Drug override | batch sellPrice wins for "Artemether-Lumefantrine" | >18 (blob) | 20 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Adhesive Plaster" | override honored | 2 |  |
| 🟢 | Drug override | "Alcohol Wipes Pack" | override honored | 4 |  |
| 🟢 | Drug override | "Sterile Gauze Dressing" | override honored | 5 |  |
| 🟢 | Drug override | batch sellPrice wins for "Paracetamol 500mg" | >2 (blob) | 3 |  |
| 🟢 | Drug override | "Omeprazole 20mg" | override honored | 7 |  |
| 🟢 | Drug override | "Metformin 500mg" | override honored | 4 |  |
| 🟢 | Drug override | "Antiseptic Ointment" | override honored | 8 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Intensive Care Unit/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Intensive Care Unit/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Intensive Care Unit/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Intensive Care Unit/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Male General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Male General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Male General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Female General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Female General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Female General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Male General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Male General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Male General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Male General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Male General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Emergency Observation/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Emergency Observation/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Emergency Observation/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Emergency Observation/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Emergency Observation/General nightly | 80 | 80 |  |
| 🟢 | Ward | Emergency Observation/General nightly | 80 | 80 |  |
| 🟢 | Ward | Emergency Observation/General nightly | 80 | 80 |  |
| 🟢 | Ward | Emergency Observation/General nightly | 80 | 80 |  |
| 🟢 | Ward | Emergency Observation/General nightly | 80 | 80 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Intensive Care Unit/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Intensive Care Unit/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Intensive Care Unit/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Intensive Care Unit/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Intensive Care Unit/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Surgical Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Surgical Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Surgical Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Surgical Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Female General Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Female General Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Female General Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Female General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Female General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Female General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Female General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Male General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Male General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Male General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Male General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Surgical Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Surgical Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Surgical Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Emergency Observation/General nightly | 80 | 80 |  |
| 🟢 | Ward | Emergency Observation/General nightly | 80 | 80 |  |
| 🟢 | Ward | Emergency Observation/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Male General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Male General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Male General Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Intensive Care Unit/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Intensive Care Unit/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Intensive Care Unit/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Intensive Care Unit/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Intensive Care Unit/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Female General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Emergency Observation/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Emergency Observation/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Emergency Observation/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Emergency Observation/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Emergency Observation/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Emergency Observation/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Emergency Observation/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Emergency Observation/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Emergency Observation/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Emergency Observation/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Emergency Observation/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Male General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Male General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Male General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Male General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Male General Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Pediatric Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Pediatric Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Pediatric Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Surgical Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Surgical Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Surgical Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Intensive Care Unit/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Intensive Care Unit/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Intensive Care Unit/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Private Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Pediatric Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Pediatric Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Pediatric Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Private Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Private Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Private Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Private Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Private Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Private Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Private Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Private Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Private Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Private Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Surgical Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Private Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Private Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Private Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Private Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Private Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Pediatric Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Pediatric Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Pediatric Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Pediatric Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Pediatric Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Pediatric Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Private Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Private Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Private Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Private Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Private Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Private Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Private Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Private Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Surgical Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Surgical Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Surgical Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Surgical Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Surgical Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Surgical Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Emergency Observation/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Female General Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Intensive Care Unit/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Semi-Private nightly | 150 | 150 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/Private nightly | 250 | 250 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/ICU nightly | 400 | 400 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/VIP nightly | 600 | 600 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Ward | Maternity Ward/General nightly | 80 | 80 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Injection | default fee | 15 | 15 |  |
| 🟢 | Aggregate | TEST- gross revenue total | sum of totalCost | ₵237534.00 |  |
| 🟢 | Aggregate | TEST- commission total | sum of staffCutCost | ₵4770.50 |  |
| 🟢 | Per-doctor | Dr. Kofi Asante | sum of doctor's billables | gross=₵19750.00 cut=₵2962.50 |  |
| 🟢 | Per-doctor | Dr. Abena Mensah-Pedi | sum of doctor's billables | gross=₵18080.00 cut=₵1808.00 |  |
| 🟢 | Billing | every patient has a bill | 600 | 600 |  |
| 🟢 | Billing | bill totals match sum of billables | 0 mismatches | 600 bills checked |  |
| 🟢 | Payment Mix | status distribution | PAID/PART_PAID/ISSUED/WAIVED | {"PAID":440,"PART_PAID":65,"ISSUED":65,"WAIVED":30} |  |
| 🟢 | Payment Mix | method distribution | CASH/MOMO/NHIS/INSURANCE/WAIVED | {"CASH":223,"MOBILE_MONEY":108,"NHIS":81,"INSURANCE":93,"WAIVED":30} |  |
| 🟢 | Insurance | NHIS + private claims | >0 | 174 bills, ₵80156.00 claimed |  |
| 🟢 | Finance | total bill revenue | sum of bill.total | ₵237534.00 |  |
| 🟢 | Finance | collected (PAID + PART_PAID) |  | ₵199755.00 |  |
| 🟢 | Finance | outstanding (ISSUED) |  | ₵27085.00 |  |
| 🟢 | Finance | waived |  | ₵10694.00 |  |
| 🟢 | Finance | billable gross ↔ bill total reconcile | ≈₵237534.00 | ≈₵237534.00 |  |
| 🟢 | Regression | Baby Esi Mensah: pre-existing billables preserved | >0 items | 1 items, ₵50.00 |  |
| 🟢 | Regression | Mensah Owusu: pre-existing billables preserved | >0 items | 1 items, ₵50.00 |  |
| 🟢 | Regression | Cecilia Ntow: pre-existing billables preserved | >0 items | 1 items, ₵50.00 |  |

## How to reproduce

```bash
npx tsx scripts/cleanup-test-patients.ts
npx tsx scripts/seed-pricing-test.ts
npx tsx scripts/seed-100-test-patients.ts
npx tsx scripts/verify-pricing-sync.ts
```
