
using DoodleDash.Hubs;
using DoodleDash.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddHealthChecks();

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
