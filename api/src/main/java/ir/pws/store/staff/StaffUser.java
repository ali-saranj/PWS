package ir.pws.store.staff;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;

@Entity
@Table(name = "staff_user")
public class StaffUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50, unique = true)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 11)
    private String mobile;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StaffRole role;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "failed_login_count", nullable = false)
    private int failedLoginCount;

    @Column(name = "failed_login_window_start")
    private Instant failedLoginWindowStart;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Version
    @Column(nullable = false)
    private long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StaffUser() {}

    public StaffUser(String username, String passwordHash, String mobile, String fullName, StaffRole role) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.mobile = mobile;
        this.fullName = fullName;
        this.role = role;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    /** Counts a failed password within a rolling window; the 5th failure in the window locks the account. */
    public void recordFailedLogin(Instant now, java.time.Duration window, int maxFailures, java.time.Duration lock) {
        if (failedLoginWindowStart == null || failedLoginWindowStart.plus(window).isBefore(now)) {
            failedLoginCount = 0;
            failedLoginWindowStart = now;
        }
        failedLoginCount++;
        if (failedLoginCount >= maxFailures) {
            lockedUntil = now.plus(lock);
        }
    }

    public void clearLoginFailures() {
        failedLoginCount = 0;
        failedLoginWindowStart = null;
        lockedUntil = null;
    }

    public boolean isLocked(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    public void updateProfile(String fullName, String mobile, StaffRole role, boolean active) {
        this.fullName = fullName;
        this.mobile = mobile;
        this.role = role;
        this.active = active;
    }

    public void changePasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getMobile() {
        return mobile;
    }

    public String getFullName() {
        return fullName;
    }

    public StaffRole getRole() {
        return role;
    }

    public boolean isActive() {
        return active;
    }

    public int getFailedLoginCount() {
        return failedLoginCount;
    }

    public Instant getFailedLoginWindowStart() {
        return failedLoginWindowStart;
    }

    public Instant getLockedUntil() {
        return lockedUntil;
    }

    public long getVersion() {
        return version;
    }
}
