import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MediSwiftzzz database...');

  const hashPw = (p: string) => bcrypt.hash(p, 12);

  // Admin user
  const adminPw = await hashPw('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mediswiftzzz.com' },
    update: {},
    create: { email: 'admin@mediswiftzzz.com', password: adminPw, name: 'Admin User', phone: '9000000001', role: 'ADMIN' },
  });

  // Pharmacist
  const pharmPw = await hashPw('Pharm@123');
  const pharmacist = await prisma.user.upsert({
    where: { email: 'pharmacist@mediswiftzzz.com' },
    update: {},
    create: { email: 'pharmacist@mediswiftzzz.com', password: pharmPw, name: 'Dr. Pharmacy', phone: '9000000002', role: 'PHARMACIST' },
  });

  // Patient
  const patientPw = await hashPw('Patient@123');
  const patient = await prisma.user.upsert({
    where: { email: 'patient@mediswiftzzz.com' },
    update: {},
    create: { email: 'patient@mediswiftzzz.com', password: patientPw, name: 'John Patient', phone: '9000000003', role: 'PATIENT' },
  });

  // Delivery partner
  const dpPw = await hashPw('Delivery@123');
  const deliveryPartner = await prisma.user.upsert({
    where: { email: 'delivery@mediswiftzzz.com' },
    update: {},
    create: { email: 'delivery@mediswiftzzz.com', password: dpPw, name: 'Raju Delivery', phone: '9000000004', role: 'DELIVERY_PARTNER' },
  });

  // Patient address
  await prisma.address.upsert({
    where: { id: 'seed-address-1' },
    update: {},
    create: {
      id: 'seed-address-1',
      userId: patient.id, label: 'Home', line1: '12, MG Road', city: 'Bangalore',
      state: 'Karnataka', pincode: '560001', lat: 12.9716, lng: 77.5946, isDefault: true,
    },
  });

  // Cart for patient
  await prisma.cart.upsert({ where: { userId: patient.id }, update: {}, create: { userId: patient.id } });

  // Medicines
  const medicines = [
    { name: 'Paracetamol 500mg', genericName: 'Paracetamol', manufacturer: 'GSK', category: 'Analgesics', requiresPrescription: false, price: 25.0, description: 'Fever and pain relief', stock: 200 },
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', manufacturer: 'Cipla', category: 'Antibiotics', requiresPrescription: true, price: 120.0, description: 'Antibiotic for infections', stock: 100 },
    { name: 'Metformin 500mg', genericName: 'Metformin', manufacturer: 'Sun Pharma', category: 'Diabetes', requiresPrescription: true, price: 80.0, description: 'Type 2 diabetes medication', stock: 150 },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', manufacturer: 'Ranbaxy', category: 'Gastro', requiresPrescription: false, price: 45.0, description: 'Acid reflux medication', stock: 120 },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine', manufacturer: 'Cipla', category: 'Allergy', requiresPrescription: false, price: 30.0, description: 'Antihistamine', stock: 180 },
    { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin', manufacturer: 'Pfizer', category: 'Cardiovascular', requiresPrescription: true, price: 95.0, description: 'Cholesterol medication', stock: 90 },
    { name: 'Azithromycin 250mg', genericName: 'Azithromycin', manufacturer: 'Cipla', category: 'Antibiotics', requiresPrescription: true, price: 150.0, description: 'Broad spectrum antibiotic', stock: 80 },
    { name: 'Vitamin D3 1000IU', genericName: 'Cholecalciferol', manufacturer: 'Abbott', category: 'Vitamins', requiresPrescription: false, price: 200.0, description: 'Vitamin D supplement', stock: 300 },
  ];

  for (const med of medicines) {
    const { stock, ...medData } = med;
    await prisma.medicine.upsert({
      where: { id: `seed-med-${med.name.replace(/\s+/g, '-').toLowerCase()}` },
      update: {},
      create: {
        id: `seed-med-${med.name.replace(/\s+/g, '-').toLowerCase()}`,
        ...medData,
        inventory: { create: { stock } },
      },
    });
  }

  console.log('✅ Seeding complete!');
  console.log('\n📋 Demo credentials:');
  console.log('Admin:     admin@mediswiftzzz.com / Admin@123');
  console.log('Pharmacist: pharmacist@mediswiftzzz.com / Pharm@123');
  console.log('Patient:   patient@mediswiftzzz.com / Patient@123');
  console.log('Delivery:  delivery@mediswiftzzz.com / Delivery@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
