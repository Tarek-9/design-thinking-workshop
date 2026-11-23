package de.ichbinhier.volunteerformservice.dashboard;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import de.ichbinhier.volunteerformservice.application.ApplicationSubmitted;

// Broadcasts race heartbeats: copy-on-write list, a lock per emitter.
@Component
public class ApplicationEventStream {

    private static final long HEARTBEAT_INTERVAL_MILLIS = 20000;

    private static final long CONNECTION_TIMEOUT_MILLIS = 3600000;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    private final AtomicLong eventCounter = new AtomicLong();

    // A heartbeat finds a dead network within seconds, well before the timeout.
    SseEmitter open() {
        SseEmitter emitter = new SseEmitter(CONNECTION_TIMEOUT_MILLIS);
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(failure -> emitters.remove(emitter));

        Thread.ofPlatform().name("dashboard-heartbeat").daemon().start(() -> heartbeat(emitter));
        return emitter;
    }

    void updated(ApplicationDto application) {
        send("application.updated", application);
    }

    void deleted(ApplicationDto application) {
        send("application.deleted", application);
    }

    @EventListener
    void applicationCreated(ApplicationSubmitted submitted) {
        send("application.created", ApplicationDto.of(submitted.application()));
    }

    // A rollback would still be announced, and the stream cannot replay to correct
    // it, so the event waits for the commit.
    private void send(String event, ApplicationDto application) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            broadcast(event, application);
                        }
                    });
            return;
        }

        broadcast(event, application);
    }

    private void broadcast(String event, ApplicationDto application) {
        String id = String.valueOf(eventCounter.incrementAndGet());

        for (SseEmitter emitter : emitters) {
            write(emitter, SseEmitter.event()
                    .id(id)
                    .name(event)
                    .data(application, MediaType.APPLICATION_JSON));
        }
    }

    private void heartbeat(SseEmitter emitter) {
        try {
            while (emitters.contains(emitter)) {
                if (!write(emitter, SseEmitter.event().comment("heartbeat"))) {
                    return;
                }
                Thread.sleep(HEARTBEAT_INTERVAL_MILLIS);
            }
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    // A closed tab must not fail the request that caused the event.
    private boolean write(SseEmitter emitter, SseEmitter.SseEventBuilder payload) {
        synchronized (emitter) {
            try {
                emitter.send(payload);
                return true;
            } catch (IOException | IllegalStateException disconnected) {
                emitters.remove(emitter);
                return false;
            }
        }
    }

}
