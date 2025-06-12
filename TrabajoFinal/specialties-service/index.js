const { ApolloServer, gql } = require('apollo-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const { request } = require('https');

// Conexión a MongoDB
mongoose.connect('mongodb://mongo:27017/specialtiesdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Esquemas
const specialtySchema = new mongoose.Schema({
  name: { type: String, required: true }
});
const scheduleSchema = new mongoose.Schema({
  doctor_id: { type: Number, required: true },
  date: { type: Date, required: true },
  time_slots: { type: [String], required: true },
  specialty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true }
});

const Specialty = mongoose.model('Specialty', specialtySchema);
const Schedule = mongoose.model('Schedule', scheduleSchema);

// Schema GraphQL
const typeDefs = gql`
  type Specialty {
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
`;

// Resolvers
const resolvers = {
  Query: {
    getSpecialties: async (_, __, { user }) => {
      if (!user) throw new Error('Authentication required');
      return await Specialty.find();
    },
    getDoctorAvailability: async (_, { doctorId, date }, { user }) => {
      if (!user) throw new Error('Authentication required');
      const queryDate = new Date(date);
      return await Schedule.find({ doctor_id: doctorId, date: { $gte: queryDate, $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000) } });
    }
  },
  Mutation: {
    createSpecialty: async (_, { name }, { user }) => {
      if (!user || user.role !== 'admin') throw new Error('Admin access required');
      const specialty = new Specialty({ name });
      return await specialty.save();
    },
    setDoctorSchedule: async (_, { doctorId, date, timeSlots }, { user }) => {
      if (!user || user.role !== 'medico') throw new Error('Medico access required');
      const schedule = new Schedule({ doctor_id: doctorId, date: new Date(date), time_slots: timeSlots });
      return await schedule.save();
    }
  }
};

// Transporte personalizado para enviar logs a Loki
class LokiTransportCustom extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.lokiUrl = opts.lokiUrl || 'http://loki:3100/loki/api/v1/push';
    this.labels = opts.labels || { app: 'specialties-service' };
  }

  log(info, callback) {
    const { level, message, ...meta } = info;
    const payload = {
      streams: [
        {
          stream: { ...this.labels, level },
          values: [[Date.now().toString(), `${message} ${JSON.stringify(meta)}`]]
        }
      ]
    };

    const req = request(
      this.lokiUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', callback);
      }
    );

    req.on('error', (err) => callback(err));
    req.write(JSON.stringify(payload));
    req.end();
  }
}

// Configuración de logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'specialties.log' }),
    new LokiTransportCustom({
      lokiUrl: 'http://loki:3100/loki/api/v1/push',
      labels: { app: 'specialties-service' }
    })
  ]
});

// Contexto para validar JWT y loggear solicitudes
const context = async ({ req }) => {
  const start = Date.now();
  const token = req.headers.authorization?.split(' ')[1];
  let user = {};
  if (token) {
    try {
      user = jwt.verify(token, 'your_secret');
    } catch (err) {
      throw new Error('Invalid token');
    }
  }
  const duration = Date.now() - start;
  logger.info('GraphQL Context', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    duration: `${duration}ms`,
    ip: req.ip,
    user: user.id || 'anonymous'
  });
  return { user };
};

// Servidor Apollo
const server = new ApolloServer({ typeDefs, resolvers, context });
server.listen(3001).then(({ url }) => {
  console.log(`GraphQL server at ${url}`);
});