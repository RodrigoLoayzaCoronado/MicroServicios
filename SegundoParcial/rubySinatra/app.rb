require 'sinatra'
require 'mongo'
require 'json'
require 'jwt'
require 'dotenv/load'
require './config/database'

# Configuración de Sinatra
set :show_exceptions, false
set :raise_errors, true
set :bind, '0.0.0.0'

# Middleware de autenticación JWT
before do
  pass if request.path_info == '/health'

  auth_header = request.env['HTTP_AUTHORIZATION']
  unless auth_header && auth_header.start_with?('Bearer ')
    halt 401, { success: false, message: 'Token de acceso requerido' }.to_json
  end

  token = auth_header.split(' ')[1]
  begin
    decoded = JWT.decode(token, ENV['JWT_SECRET'], true, { algorithm: 'HS256' })
    @admin = decoded[0]
    unless @admin['tipo'] == 'administrador'
      halt 403, { success: false, message: 'Acceso denegado. Se requieren privilegios de administrador' }.to_json
    end
  rescue JWT::DecodeError => e
    halt 401, { success: false, message: 'Token no válido', error: e.message }.to_json
  rescue JWT::ExpiredSignature
    halt 401, { success: false, message: 'Token expirado', code: 'TOKEN_EXPIRED' }.to_json
  end
end

# Ruta de salud (pública)
get '/health' do
  { success: true, message: 'Microservicio Habitaciones funcionando' }.to_json
end

# Listar todas las habitaciones
get '/habitaciones' do
  begin
    habitaciones = $db[:habitaciones].find.to_a
    habitaciones.each { |h| h['_id'] = h['_id'].to_s }
    { success: true, data: habitaciones }.to_json
  rescue => e
    status 500
    { success: false, message: 'Error al obtener habitaciones', error: e.message }.to_json
  end
end

# Obtener una habitación por ID
get '/habitaciones/:id' do
  begin
    id = params[:id]
    unless BSON::ObjectId.legal?(id)
      halt 400, { success: false, message: 'ID no válido' }.to_json
    end
    habitacion = $db[:habitaciones].find(_id: BSON::ObjectId(id)).first
    unless habitacion
      halt 404, { success: false, message: 'Habitación no encontrada' }.to_json
    end
    habitacion['_id'] = habitacion['_id'].to_s
    { success: true, data: habitacion }.to_json
  rescue => e
    status 500
    { success: false, message: 'Error al obtener habitación', error: e.message }.to_json
  end
end

# Crear una nueva habitación
post '/habitaciones' do
  begin
    data = JSON.parse(request.body.read)
    required_fields = %w[numero tipo precio disponible]
    missing_fields = required_fields.reject { |field| data.key?(field) }
    if missing_fields.any?
      halt 400, { success: false, message: "Faltan campos requeridos: #{missing_fields.join(', ')}" }.to_json
    end

    unless data['numero'].is_a?(String) && data['tipo'].is_a?(String) &&
           data['precio'].is_a?(Numeric) && [true, false].include?(data['disponible'])
      halt 400, { success: false, message: 'Tipos de datos inválidos' }.to_json
    end

    if $db[:habitaciones].find(numero: data['numero']).first
      halt 409, { success: false, message: 'El número de habitación ya existe' }.to_json
    end

    result = $db[:habitaciones].insert_one(data)
    created_habitacion = $db[:habitaciones].find(_id: result.inserted_id).first
    created_habitacion['_id'] = created_habitacion['_id'].to_s
    status 201
    { success: true, message: 'Habitación creada exitosamente', data: created_habitacion }.to_json
  rescue JSON::ParserError
    halt 400, { success: false, message: 'Cuerpo de la solicitud no es JSON válido' }.to_json
  rescue => e
    status 500
    { success: false, message: 'Error al crear habitación', error: e.message }.to_json
  end
end

# Actualizar una habitación
put '/habitaciones/:id' do
  begin
    id = params[:id]
    unless BSON::ObjectId.legal?(id)
      halt 400, { success: false, message: 'ID no válido' }.to_json
    end
    data = JSON.parse(request.body.read)
    allowed_fields = %w[numero tipo precio disponible]
    data = data.slice(*allowed_fields)
    if data.empty?
      halt 400, { success: false, message: 'No se proporcionaron campos para actualizar' }.to_json
    end

    if data['numero'] && !data['numero'].is_a?(String)
      halt 400, { success: false, message: 'El número debe ser una cadena' }.to_json
    end
    if data['tipo'] && !data['tipo'].is_a?(String)
      halt 400, { success: false, message: 'El tipo debe ser una cadena' }.to_json
    end
    if data['precio'] && !data['precio'].is_a?(Numeric)
      halt 400, { success: false, message: 'El precio debe ser numérico' }.to_json
    end
    if data['disponible'] && ![true, false].include?(data['disponible'])
      halt 400, { success: false, message: 'Disponible debe ser un booleano' }.to_json
    end

    if data['numero'] && $db[:habitaciones].find(numero: data['numero'], :_id.ne => BSON::ObjectId(id)).first
      halt 409, { success: false, message: 'El número de habitación ya existe' }.to_json
    end

    result = $db[:habitaciones].update_one({ _id: BSON::ObjectId(id) }, { '$set' => data })
    if result.matched_count == 0
      halt 404, { success: false, message: 'Habitación no encontrada' }.to_json
    end
    updated_habitacion = $db[:habitaciones].find(_id: BSON::ObjectId(id)).first
    updated_habitacion['_id'] = updated_habitacion['_id'].to_s
    { success: true, message: 'Habitación actualizada exitosamente', data: updated_habitacion }.to_json
  rescue JSON::ParserError
    halt 400, { success: false, message: 'Cuerpo de la solicitud no es JSON válido' }.to_json
  rescue => e
    status 500
    { success: false, message: 'Error al actualizar habitación', error: e.message }.to_json
  end
end

# Eliminar una habitación
delete '/habitaciones/:id' do
  begin
    id = params[:id]
    unless BSON::ObjectId.legal?(id)
      halt 400, { success: false, message: 'ID no válido' }.to_json
    end
    result = $db[:habitaciones].delete_one(_id: BSON::ObjectId(id))
    if result.deleted_count == 0
      halt 404, { success: false, message: 'Habitación no encontrada' }.to_json
    end
    { success: true, message: 'Habitación eliminada exitosamente' }.to_json
  rescue => e
    status 500
    { success: false, message: 'Error al eliminar habitación', error: e.message }.to_json
  end
end