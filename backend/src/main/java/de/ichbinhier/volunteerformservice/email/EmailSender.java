package de.ichbinhier.volunteerformservice.email;

public interface EmailSender {

    void send(String toAddress, String subject, String htmlBody);

}
