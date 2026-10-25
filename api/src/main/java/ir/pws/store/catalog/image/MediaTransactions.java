package ir.pws.store.catalog.image;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Keeps media files and database rows from drifting apart. Must be called inside a transaction. */
public final class MediaTransactions {

    private MediaTransactions() {}

    /** Writes the files now; if the surrounding transaction does not commit, they are deleted again. */
    public static void saveFiles(MediaStorage storage, Map<String, byte[]> files) {
        List<String> written = new ArrayList<>();
        try {
            for (var entry : files.entrySet()) {
                storage.save(entry.getKey(), entry.getValue());
                written.add(entry.getKey());
            }
        } catch (RuntimeException e) {
            written.forEach(storage::delete);
            throw e;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    written.forEach(storage::delete);
                }
            }
        });
    }

    /** Deletes the files only after the surrounding transaction has committed. */
    public static void deleteFilesAfterCommit(MediaStorage storage, Collection<String> relPaths) {
        List<String> paths = List.copyOf(relPaths);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                paths.forEach(storage::delete);
            }
        });
    }
}
