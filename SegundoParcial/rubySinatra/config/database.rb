require 'mongo'

Mongo::Logger.logger.level = ::Logger::FATAL

begin
  client = Mongo::Client.new(ENV['MONGODB_URI'], server_selection_timeout: 5)
  $db = client.database
  $db[:habitaciones].indexes.create_one({ numero: 1 }, unique: true)
  puts "Conexión a MongoDB establecida correctamente"
rescue Mongo::Error => e
  puts "Error al conectar con MongoDB: #{e.message}"
  exit 1
end