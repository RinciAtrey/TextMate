FROM amazoncorretto:21

LABEL version="1.0"

EXPOSE 8080:8080

WORKDIR /app

#                             source    ->     destination
COPY target/TextMate-0.0.1-SNAPSHOT.jar /app/TextMate.jar

ENTRYPOINT ["java", "-jar", "TextMate.jar"]