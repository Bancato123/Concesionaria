-- Elimina exclusivamente los 14 vehículos de demostración del catálogo.
-- Ejecutar desde Supabase SQL Editor; conservará los demás vehículos.
delete from public.vehicles
where id in (
  'd50d0730-d13b-4553-936a-71f6a399a716',
  '12e52909-5fb5-49d9-9e63-cb0a2b07e0c9',
  '61bab8bb-73b1-470a-9756-97807d2bb21d',
  'c90a307f-cecd-4f66-88fc-485d24ac8d18',
  '60697311-6259-4e08-bbb4-fb021ed65835',
  '20cba104-df6c-405c-9bfa-3739e6cf1a3a',
  '09e74d29-1582-4b88-915e-f631fc4aba80',
  'd97e0c6b-1651-4754-b118-87d67df81021',
  '096e124e-a26a-4879-83e7-0b8ea857018b',
  '75f070ac-16e6-4768-aa7a-ba297a72e465',
  'e7cf3e7f-40ff-4bab-a0b9-e487d1ed2796',
  '9e7cd7ed-6967-4cd2-a3be-d623d0d86f49',
  '38037143-2c50-4c5c-97db-0044a1f837e8',
  '89fad8d0-ebe1-4577-8c52-c54aba4267a3'
)
returning id, brand, model;
