
using DoodleDash.Hubs;
using DoodleDash.Models;
using DoodleDash.Services;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddHealthChecks();

builder.Services.Configure<RedisRoomOptions>(builder.Configuration.GetSection(RedisRoomOptions.SectionName));
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    var redisOptions = builder.Configuration.GetSection(RedisRoomOptions.SectionName).Get<RedisRoomOptions>()
        ?? new RedisRoomOptions();
    return ConnectionMultiplexer.Connect(redisOptions.ConnectionString);
});
builder.Services.AddSingleton<IRoomStateStore, RedisRoomStateStore>();
builder.Services.AddSingleton<IRoomManager, RoomManager>();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(
            builder =>
            {
                builder.WithOrigins("http://localhost:4000").AllowAnyHeader()
                .WithMethods("GET", "POST").AllowCredentials();
            }
        );
    });
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors();
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "v1");
    });
}

// app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");
app.MapHub<DoodleDashHub>("/doodleDash");
app.Run();
