Contratos de APIs
Servicio de Usuarios (REST, Node.js)

POST /auth/register
Descripción: Registra un nuevo usuario.
Body: { "email": string, "password": string, "name": string, "role": "paciente|medico|admin" }
Respuesta: { "user": { "id": number, "email": string, "name": string, "role": string } }


POST /auth/login
Descripción: Autentica un usuario y devuelve un JWT.
Body: { "email": string, "password": string }
Respuesta: { "token": string }
JWT Payload: { "id": number, "role": string, "exp": timestamp }
Token válido por 24 horas.


GET /auth/profile
Descripción: Devuelve el perfil del usuario autenticado.
Headers: Authorization: Bearer <token>
Respuesta: { "id": number, "email": string, "name": string, "role": string }
Protegido con JWT.



Servicio de Reservas (REST, Python)

POST /appointments
Descripción: Crea una cita médica de 1 hora.
Headers: Authorization: Bearer <token>
Body: { "patient_id": number, "doctor_id": number, "date": string (YYYY-MM-DD), "time": string (HH:MM) }
Respuesta: { "appointment": { "id": number, "patient_id": number, "doctor_id": number, "date": string, "time": string, "status": "confirmed" } }


GET /appointments/patient/:patient_id
Descripción: Lista las citas de un paciente.
Headers: Authorization: Bearer <token>
Respuesta: { "appointments": [{ "id": number, "doctor_id": number, "date": string, "time": string, "status": string }] }


GET /appointments/doctor/:doctor_id
Descripción: Lista las citas de un médico.
Headers: Authorization: Bearer <token>
Respuesta: { "appointments": [{ "id": number, "patient_id": number, "date": string, "time": string, "status": string }] }


DELETE /appointments/:id
Descripción: Cancela una cita.
Headers: Authorization: Bearer <token>
Respuesta: { "message": "Appointment cancelled" }



Servicio de Especialidades y Agendas (GraphQL, Node.js)

Schema:type Specialty {
  id: ID!
  name: String!
}
type Schedule {
  id: ID!
  doctor_id: Int!
  date: String!
  time_slots: [String!]!
  specialty_id: ID!
}
type Query {
  getSpecialties: [Specialty!]!
  getDoctorAvailability(doctorId: Int!, date: String!): [Schedule!]!
}
type Mutation {
  createSpecialty(name: String!): Specialty!
  setDoctorSchedule(doctorId: Int!, date: String!, timeSlots: [String!]!): Schedule!
}


Notas:
Todas las operaciones requieren JWT.
createSpecialty solo accesible para rol admin.
setDoctorSchedule solo accesible para rol medico.



