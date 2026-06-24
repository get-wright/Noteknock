import uuid

from app.models.attachment import Attachment


def test_attachment_constructs_with_required_metadata():
    owner_id = uuid.uuid4()
    attachment = Attachment(
        owner_id=owner_id,
        key=f"{owner_id}/file.pdf",
        filename="file.pdf",
        content_type="application/pdf",
        size_bytes=1234,
    )

    assert attachment.owner_id == owner_id
    assert attachment.note_id is None
    assert attachment.filename == "file.pdf"
    assert attachment.content_type == "application/pdf"
    assert attachment.size_bytes == 1234
