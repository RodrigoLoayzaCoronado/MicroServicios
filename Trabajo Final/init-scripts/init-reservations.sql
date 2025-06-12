-- ./init-scripts/init-reservations.sql

-- 1. Define el tipo ENUM para el estado de la cita
-- Debes crear el tipo ENUM primero, antes de usarlo en una tabla.
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('confirmed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Crea la tabla 'appointments'
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status appointment_status DEFAULT 'confirmed' -- Usa el tipo ENUM que acabamos de definir
);

-- Opcional: Puedes añadir algunos datos de prueba si lo deseas
-- INSERT INTO appointments (patient_id, doctor_id, date, time, status) VALUES
-- (1, 101, '2025-06-15', '09:00:00', 'confirmed'),
-- (2, 102, '2025-06-15', '10:00:00', 'confirmed');