package de.ichbinhier.volunteerformservice.dashboard;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class EventStreamController {

    private final ApplicationEventStream stream;

    // Set here too: a buffering proxy would batch the events and hide live updates.
    @GetMapping(path = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    ResponseEntity<SseEmitter> events() {
        return ResponseEntity.ok()
            .header("X-Accel-Buffering", "no")
            .body(stream.open());
    }

}
