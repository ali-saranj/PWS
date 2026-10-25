package ir.pws.store.catalog.image;

import jakarta.validation.constraints.Size;

public record ImageAltRequest(@Size(max = 200) String altFa, @Size(max = 200) String altEn) {}
