FROM mcr.microsoft.com/dotnet/sdk:10.0

# Create a user matching the host UID/GID (1000) so volume-mounted files
# have the correct ownership. Skip if the base image already has them.
RUN (getent group 1000 > /dev/null 2>&1 || groupadd --gid 1000 appuser) && \
    (getent passwd 1000 > /dev/null 2>&1 || useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash appuser)

WORKDIR /workspace
RUN chown 1000:1000 /workspace

USER 1000

# http and https dev ports
EXPOSE 5103
EXPOSE 7029

# dotnet run is invoked by docker-compose with the correct project/profile.
# Default fallback if the container is started directly.
CMD ["dotnet", "run", "--project", "DoodleDash/DoodleDash.csproj", "--launch-profile", "http"]
