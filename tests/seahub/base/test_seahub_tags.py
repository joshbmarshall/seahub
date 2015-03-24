from django.test import TestCase
from django.utils import translation
from django.utils.safestring import mark_safe, SafeData

from seahub.base.templatetags.seahub_tags import translate_commit_desc

class TranslateCommitDescTest(TestCase):
    desc_list = [
        'Added "foo.txt".',
        'Modified "foo.txt" and 3 more files.',
        'Renamed "foo.txt".',
        'Moved "foo.txt".',
        'Added directory "bar".',
        'Renamed directory "bar".',
        'Moved directory "bar".',
        'Deleted "foo.txt".',
        'Reverted file "foo.txt" to status at 2015-12-21.',
        'Removed directory "bar".',
    ]

    safe_desc_list = [
        mark_safe('Added "<a href="#">foo.txt</a>".'),
        mark_safe('Modified "<a href="#">foo.txt</a>".'),
        mark_safe('Renamed "<a href="#">foo.txt</a>".'),
        mark_safe('Moved "<a href="#">foo.txt</a>".'),
        mark_safe('Added directory "<a href="#">bar</a>".'),
        mark_safe('Renamed directory "<a href="#">bar</a>".'),
        mark_safe('Moved directory "<a href="#">bar</a>".'),
    ]

    unsafe_desc_list = [
        'Added "<a href="#">foo.txt</a>".',
        'Modified "<a href="#">foo.txt</a>".',
        'Renamed "<a href="#">foo.txt</a>".',
        'Moved "<a href="#">foo.txt</a>".',
        'Added directory "<a href="#">bar</a>".',
        'Renamed directory "<a href="#">bar</a>".',
        'Moved directory "<a href="#">bar</a>".',
        'Reverted file "foo.txt" to status at 2015-12-21.',
    ]

    def setUp(self):
        translation.activate('en')

    def test_translation(self):
        translation.activate('zh-cn')

        for e in self.desc_list:
            ret = translate_commit_desc(e)
            self.assertIsInstance(ret, unicode)

    def test_unsafe_desc(self):
        for e in self.unsafe_desc_list:
            ret = translate_commit_desc(e)
            self.assertIsInstance(ret, str)

        translation.activate('zh-cn')

        for e in self.safe_desc_list:
            ret = translate_commit_desc(e)
            self.assertIsInstance(ret, unicode)

    def test_safe_desc(self):
        for e in self.safe_desc_list:
            ret = translate_commit_desc(e)
            self.assertIsInstance(ret, SafeData)
            self.assertIn('<a href=', ret)

        translation.activate('zh-cn')

        for e in self.safe_desc_list:
            ret = translate_commit_desc(e)
            self.assertIsInstance(ret, SafeData)
            self.assertIn('<a href=', ret)
